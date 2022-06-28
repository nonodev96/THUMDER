#!/bin/bash
echo 'Running Script'

PATH_UML_INPUT="/Users/nonodev96/WebstormProjects/THUMDER/UML/4.Sequence/"
PATH_UML_OUTPUT="/Users/nonodev96/PNG/"

FILES="
4.1.SignIn
4.2.LogIn
4.3.CreateFile
4.4.ModifyAccount
4.5.ShowInfoApp
4.7.DeleteFile
4.8.RenameFile
4.9.EditFile
4.10.AutocompleteCode
4.11.ShowDocumentationCode
4.12.ShowErrorsInCode
4.13.ShowLogs
4.14.ModifyMemory
4.15.ModifyRegisters
4.16.ShowPipeline
4.17.ShowDiagram
4.18.ShowMemoryCode
4.19.ShowMemory
4.20.ShowRegisters
4.21.Config
4.22.Calculator
4.23.LoadSimulation
4.24.NextStepInSimulation
4.25.Simulation
"
for filename in $FILES ; do
  echo $filename
  # Generamos un png a partir del uml
  java -jar /Users/nonodev96/Applications/plantuml/plantuml.jar "${PATH_UML_INPUT}${filename}.puml" -png -o "${PATH_UML_OUTPUT}"
  # Generamos un pdf optimizado mediante el svg anterior
#  inkscape --export-filename="${PATH_UML_OUTPUT}${filename}.pdf" "${PATH_UML_INPUT}${filename}.svg" &> /dev/null
done
