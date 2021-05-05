# INIT
rm(list = ls())
source('r/_shared.r', encoding = 'UTF-8')
library(ggplot2)

#d.raw = fread('./r/data/CovidFaelle_Timeline.csv')
d.raw = fread(
    'https://covid19-dashboard.ages.at/data/CovidFaelle_Timeline.csv'
)

d = d.raw[Bundesland == 'Österreich', .(
    d = as.Date(Time, format="%d.%m.%Y"),
    n = AnzahlFaelle
)]



# 
# d.raw.m = fread(
#     'https://info.gesundheitsministerium.gv.at/data/timeline-faelle-ems.csv'
# )
# 
# 
# d.m = d.raw.m[BundeslandID == 10, .(
#     d = as.Date(substr(Datum, 1, 10)),
#     ns = BestaetigteFaelleEMS
# )]
# 
# d.m[, n := shift(ns, -1) - ns]

# merge(d, d.m, by=c('d'))


meanDays = 7
d[, n7 := (cumsum(n) - shift(cumsum(n), meanDays, fill = 0))/meanDays]

d[, n7g := sqrt((shift(n7, -2) + shift(n7, -1) + n7)/(n7 + shift(n7, 1) + shift(n7, 2)))]


l = nrow(d)
d[l, ]

ggplot(d, aes(x = d, y = n7)) + geom_line()
ggplot(d[d > '2020-04-01'], aes(x = d, y = n7g)) + geom_line()

fwrite(d, g$f$cases.out)
