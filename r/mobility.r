# ------------------------------------------------------------------------------
# INIT
# ------------------------------------------------------------------------------
rm(list = ls())
source('r/_shared.r', encoding = 'UTF-8')
library(ggplot2)
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# DEFS
# ------------------------------------------------------------------------------
download = FALSE
use.mobility.cats = c(
    "retail_and_recreation_percent_change_from_baseline" = FALSE,
    "grocery_and_pharmacy_percent_change_from_baseline" = FALSE,
    "parks_percent_change_from_baseline" = FALSE,
    "transit_stations_percent_change_from_baseline" = TRUE,
    "workplaces_percent_change_from_baseline" = TRUE,
    "residential_percent_change_from_baseline" = TRUE
)
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# LOAD / PREPARE
# ------------------------------------------------------------------------------
if (download) {
    download.file(g$u$cases.ages, g$f$cases.tmp)
    download.file(g$u$mobility.google, g$f$mobility.tmp)
    #download.file(g$u$temp.vienna, g$f$temp.tmp)
}

# CASES
d.cases = fread(g$f$cases.tmp)
d.cases.at = d.cases[Bundesland == 'Österreich', .(
    d = as.Date(Time, format="%d.%m.%Y"),
    cases.n = AnzahlFaelle,
    cured.p = AnzahlGeheiltSum/AnzEinwohner
)]

# TEMP
# d.temp = as.data.table(read.table(gzfile(g$f$temp.tmp), sep = ',', dec = '.'))
# d.temp = d.temp[, .(
#     d = as.Date(V1),
#     temp = V2
# )][d > '2020-01-01' & d < substring(Sys.time(), 1, 10)]
# d.temp = merge(
#     d.temp, data.table(d = as.Date(min(d.temp$d):max(d.temp$d), origin = '1970-01-01'))
# , by='d', all = T)
# d.temp[, temp.n := (shift(temp, 1) + shift(temp, -1))/2]
# d.temp[is.na(temp), temp := temp.n]
# d.temp[, temp.n := NULL]

# MOBILITY
d.mobility = rbindlist(lapply(2020:2021, function(y) 
    read.csv(unz(g$f$mobility.tmp, filename = glue('{y}_AT_Region_Mobility_Report.csv')), encoding = 'UTF-8')
))
d.mobility.at = d.mobility[sub_region_1 == '', .(
    d = as.Date(date),
    #n = get(mob.cats[4]) + get(mob.cats[6])
    combined_percent_change_from_baseline = rowSums(d.mobility[sub_region_1 == '', names(use.mobility.cats)[use.mobility.cats], with = F])/sum(use.mobility.cats),
    d.mobility[sub_region_1 == '', names(use.mobility.cats), with = F]
)]
d.mobility.at[, combined := log((combined_percent_change_from_baseline + 100)/100)]
rm(d.cases, d.mobility)
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# MEAN
# ------------------------------------------------------------------------------
meanDays = 7

d.cases.at[, n7 := (cumsum(cases.n) - shift(cumsum(cases.n), meanDays, fill = 0))/meanDays]
d.cases.at[, n7g := sqrt((shift(n7, -2) + shift(n7, -1) + n7)/(n7 + shift(n7, 1) + shift(n7, 2)))]
d.cases.at[, n7galt := (shift(n7, -5)/shift(n7, 5))]

invisible(sapply(setdiff(colnames(d.mobility.at), 'd'), function (col) {
    d.mobility.at[, (glue('{col}.{meanDays}')) := (cumsum(get(col)) - shift(cumsum(get(col)), meanDays))/meanDays]
    d.mobility.at[, (col) := NULL]
}))

#d.temp[, n7 := (cumsum(temp) - shift(cumsum(temp), meanDays))/meanDays]
# ggplot(d.temp, aes(x = date, y = n7)) + geom_line()

d.comb = merge(d.cases.at[, .(d, cases.growth = n7galt - 1)], d.mobility.at, by='d', all.x = TRUE)
#d.comb = merge(d.comb, d.temp, by='d', all.x = TRUE)
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# ANALYSE
# ------------------------------------------------------------------------------
# ggplot(d.cases.at, aes(x = d, y = n7)) + geom_line()
ggplot(
    melt(d.comb, id.vars = 'd')[, s := scale(value), by=variable], 
    aes(x = d, y = s, group = variable, color = variable)) +
    geom_line()


ggplot(
    melt(d.comb[, .(
        d, 
        cases.growth, 
        #residential_percent_change_from_baseline.7,
        combined.7
    )], id.vars = 'd')[, s := scale(value), by=variable], 
    aes(x = d, y = s, group = variable, color = variable)) +
    geom_line()




# CORRELATION
var = "combined.7"
leads = -100:100
cor.dt = data.table(
    lead = leads,
    cor = sapply(leads, function(l) {
        cor(d.comb[, .(cases.growth, shift(get(var), l, type='lead'))], use='complete.obs')[1, 2]
    })
)
ggplot(cor.dt, aes(x = lead, y = cor)) + geom_line() + 
    ylab(glue('Correlation Growth Cases vs {var}')) +
    xlab('Lead')

ggsave(file.path(g$d$tmp, glue('lag-selection.png')))


lag.sel = cor.dt[abs(cor) == max(abs(cor))]
lag.sel

ggplot(d.comb[d > '2020-04-01'], aes(x = shift(combined.7, lag.sel$lead, type='lead'), y = cases.growth)) +
    geom_path(aes(color = d), arrow = grid::arrow(length = unit(0.05, "inches"), type = 'closed')) + 
    geom_point(size = 0.5) + 
    scale_color_date(low = '#FF0000', high= '#00FF00', name = 'Date') +  
    geom_smooth(method=lm)

ggsave(file.path(g$d$tmp, glue('growth-vs-mobility{lag.sel$lead}.png')))





# ------------------------------------------------------------------
# RANDOM FOREST
# ------------------------------------------------------------------
library('randomForest')
#library('caret')
d.train = d.comb[, .(
    cases.growth, 
    cases.growth.3= shift(cases.growth, 3),
    mobility.combined.9 = shift(combined.7, 9)
    # mobility.residential.9 = shift(residential_percent_change_from_baseline.7, 9),
    #temp9 = shift(temp, 20)
)]
d.train = d.train[complete.cases(d.train)]
# d.test = loadData(g$f$prep.test)

test.size = 20
test.samples = sample(nrow(d.train), test.size)

d.train.test = d.train[test.samples]
d.train.train = d.train[-test.samples]

rf <- randomForest(
    cases.growth ~ .,
    data = d.train.train
)
# p.train = predict(rf, d.train[, -c('cases.growth'), with=FALSE])
# sqrt(mean((d.train$cases.growth - p.train)**2))

p.train.test = predict(rf, d.train.test[, -c('cases.growth'), with=FALSE])
sqrt(mean((d.train.test$cases.growth - p.train.test)**2))
# ------------------------------------------------------------------

r = lm(cases.growth ~ ., d.train)
r = lm(cases.growth ~ mobility.combined.9, d.train)
summary(r)
# ------------------------------------------------------------------------------
