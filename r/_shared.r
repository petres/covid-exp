library(data.table)
library(glue)

g = list(
    d = list(
        tmp = 'tmp',
        data = 'data'
    ),
    f = list(),
    u = list(
        cases.ages = 'https://covid19-dashboard.ages.at/data/CovidFaelle_Timeline.csv',
        cases.ems = 'https://info.gesundheitsministerium.gv.at/data/timeline-faelle-ems.csv',
        mobility.google = 'https://www.gstatic.com/covid19/mobility/Region_Mobility_Report_CSVs.zip',
        temp.vienna = 'https://bulk.meteostat.net/daily/11035.csv.gz'
    )
)

g$f = modifyList(g$f, list(
    cases.out = file.path(g$d$data, 'n.csv'),
    cases.tmp = file.path(g$d$tmp, 'cases.csv'),
    mobility.tmp = file.path(g$d$tmp, 'mobility.zip'),
    temp.tmp = file.path(g$d$tmp, 'temp.csv.gz')
))
