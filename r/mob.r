library(data.table)
library(ggplot2)

download = FALSE

#d.raw = fread('./r/data/CovidFaelle_Timeline.csv')
if (download) {
    download.file(
        'https://covid19-dashboard.ages.at/data/CovidFaelle_Timeline.csv',
        file.path('tmp', 'cases.csv')
    )
    
    download.file(
        "https://www.gstatic.com/covid19/mobility/Region_Mobility_Report_CSVs.zip",
        file.path('tmp', 'mobl.zip'
    ))
}

d.cases = fread(file.path('tmp', 'cases.csv'))
d.cases.count = d.cases[Bundesland == 'Österreich', .(
    d = as.Date(Time, format="%d.%m.%Y"),
    n = AnzahlFaelle
)]


d.mob = as.data.table(rbind(
    read.csv(unz(file.path('tmp', 'full.zip'), filename = '2020_AT_Region_Mobility_Report.csv'), encoding = 'UTF-8'),
    read.csv(unz(file.path('tmp', 'full.zip'), filename = '2021_AT_Region_Mobility_Report.csv'), encoding = 'UTF-8')
))

mob.cats = c(
    # "retail_and_recreation_percent_change_from_baseline",
    # "grocery_and_pharmacy_percent_change_from_baseline",
    # "parks_percent_change_from_baseline",
    "transit_stations_percent_change_from_baseline",
    "workplaces_percent_change_from_baseline",
    "residential_percent_change_from_baseline"
)
d.mob.at = d.mob[sub_region_1 == '']
d.mob.at = d.mob.at[, .(
    d = as.Date(date),
    #n = get(mob.cats[4]) + get(mob.cats[6])
    n = rowSums(d.mob.at[, mob.cats, with = F])
)]

meanDays = 7
d.cases.count[, n7 := (cumsum(n) - shift(cumsum(n), meanDays, fill = 0))/meanDays]
d.cases.count[, n7g := sqrt((shift(n7, -2) + shift(n7, -1) + n7)/(n7 + shift(n7, 1) + shift(n7, 2)))]

d.mob.at[, n7 := (cumsum(n) - shift(cumsum(n), meanDays, fill = 0))/meanDays]

l = nrow(d.cases.count)
d.cases.count[l, ]

ggplot(d.cases.count, aes(x = d, y = n7)) + geom_line()
ggplot() + 
    geom_line(data = d.cases.count[d > '2020-04-01'], aes(x = d, y = scale(n7g))) +
    geom_line(data = d.mob.at[d > '2020-04-01'], aes(x = d, y = scale(n7)), color = 'red')
    

d.comb = merge(d.cases.count[, .(d, cases.growth = n7g)], d.mob.at[, .(d, mob = n7)], by='d', all.x = TRUE)


leads = -100:100

cor.dt = data.table(
    lead = leads,
    cor = sapply(leads, function(l) {
        cor(d.comb[, .(cases.growth, shift(mob, l, type='lead'))], use='complete.obs')[1, 2]
    })
)
ggplot(cor.dt, aes(x = lead, y = cor)) + geom_line()
cor.dt[cor == max(cor)]

data.reg = d.comb[, .(d, cases.growth, mob = shift(mob, -9, type='lead'))]
r = lm(cases.growth ~ mob, data.reg)
summary(r)
