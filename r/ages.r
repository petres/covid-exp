# ------------------------------------------------------------------------------
# INIT
# ------------------------------------------------------------------------------
rm(list = ls())
source('r/_shared.r', encoding = 'UTF-8')
# library(ggplot2)
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# LOAD / PREPARE
# ------------------------------------------------------------------------------
d.raw = fread(paste0(g$u$cases.ages, '?', Sys.Date()))
d = d.raw[Bundesland == 'Österreich', .(
    d = as.Date(Time, format="%d.%m.%Y"),
    n = AnzahlFaelle,
    p = AnzEinwohner,
    g = AnzahlGeheiltSum
)]
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# MEAN
# ------------------------------------------------------------------------------
meanDays = 7
d[, n7 := (cumsum(n) - shift(cumsum(n), meanDays, fill = 0))/meanDays]
d[, n7g := sqrt((shift(n7, -2) + shift(n7, -1) + n7)/(n7 + shift(n7, 1) + shift(n7, 2)))]
d[, n7g6 :=
    ((shift(n7, -6) + shift(n7, -5) + shift(n7, -4) + shift(n7, -3) + shift(n7, -2) + shift(n7, -1) + n7)/
    (n7 + shift(n7, 1) + shift(n7, 2)+ shift(n7, 3) + shift(n7, 4) + shift(n7, 5) + shift(n7, 6)))**(1/6)
]
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------------------------
l = nrow(d)
d[l, ]

# ggplot(d, aes(x = d, y = n7)) + geom_line()
# ggplot(d[d > '2020-04-01'], aes(x = d, y = n7g6)) + geom_line()
fwrite(d, g$f$cases.out)
# ------------------------------------------------------------------------------
