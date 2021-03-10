library(data.table)
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



merge(d, d.m, by=c('d'))


meanDays = 7

d[, n7 := (cumsum(n) - shift(cumsum(n), meanDays, fill = 0))/meanDays]

l = nrow(d)
d[l, ]

ggplot(d, aes(x = d, y = n7)) + geom_line()

fwrite(d, './data/n.csv')
