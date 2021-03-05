library(data.table)
library(ggplot2)

#d.raw = fread('./r/data/CovidFaelle_Timeline.csv')
d.raw = fread(
    'https://covid19-dashboard.ages.at/data/CovidFaelle_Timeline.csv'
)


d.raw = d.raw[Bundesland == 'Österreich']

d = d.raw[, .(
    d = as.Date(Time, format="%d.%m.%Y"),
    n = AnzahlFaelle
)]

d[, n7 := cumsum(n) - shift(cumsum(n), 7, fill = 0)]


ggplot(d, aes(x = d, y = n7)) + geom_line()

fwrite(d, './data/n.csv')
