#!/bin/bash
echo 'Running Script'

PATH_UML_INPUT="/Users/nonodev96/WebstormProjects/THUMDER/UML/"
PATH_UML_OUTPUT="/Users/nonodev96/"

FILES="
THUMDER-core-Services
"
for filename in $FILES ; do
  echo $filename
  # Generamos un svg a partir del uml
  java -jar /Users/nonodev96/Applications/plantuml/plantuml.jar -tsvg "${PATH_UML_INPUT}${filename}.puml"
  # Generamos un pdf optimizado mediante el svg anterior
  inkscape --export-filename="${PATH_UML_OUTPUT}${filename}.pdf" "${PATH_UML_INPUT}${filename}.svg" &> /dev/null
done
