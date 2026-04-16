#!/bin/bash

#tplant --input ../src/**/*.ts --output ../UML/THUMDER.puml
#tplant --input ../src/app/__core/**/*.ts --output ../UML/CORE.puml
#tplant --input ../src/app/__shared/**/*.ts --output ../UML/SHARED.puml
#tplant --input ../src/app/_layouts/**/*.ts --output ../UML/LAYOUT.puml
#tplant --input ../src/app/components/**/*.ts --output ../UML/COMPONENTS.puml
#tplant --input ../src/app/views/**/*.ts --output ../UML/VIEWS.puml

#tplant --input ./src/**/*.ts --output ./UML/SERVICES.puml
tplant -p tsconfig.json -i ./src/app/__core/services/**/**/*.ts --output ./UML/SERVICES.puml



