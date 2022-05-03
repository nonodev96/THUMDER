#!/bin/bash
echo 'Running Script'

PATH_UML_INPUT="/Users/nonodev96/WebstormProjects/THUMDER/UML/0.Project/"
PATH_UML_OUTPUT="/Users/nonodev96/PNG/"

FILES="
0.0.Gantt-2021-08
0.0.Gantt-2021-09
0.0.Gantt-2021-10
0.0.Gantt-2021-11
0.0.Gantt-2021-12
0.0.Gantt-2022-01
0.0.Gantt-2022-02
0.0.Gantt-2022-03
0.0.Gantt-2022-04
"
for filename in $FILES ; do
  echo $filename
  # Generamos un png a partir del uml
  java -jar /Users/nonodev96/Applications/plantuml/plantuml.jar "${PATH_UML_INPUT}${filename}.puml" -png -o "${PATH_UML_OUTPUT}"
  # Generamos un pdf optimizado mediante el svg anterior
#  inkscape --export-filename="${PATH_UML_OUTPUT}${filename}.pdf" "${PATH_UML_INPUT}${filename}.svg" &> /dev/null
done
