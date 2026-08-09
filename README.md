# CC2 — Laboratorio Interactivo de Ciencias de la Computación II

Aplicación web educativa e interactiva desarrollada como proyecto académico para la asignatura **Ciencias de la Computación II** del programa de Ingeniería de Sistemas.

El proyecto tiene como objetivo representar y visualizar de manera interactiva diferentes algoritmos y estructuras estudiadas durante el curso, permitiendo al usuario observar su funcionamiento paso a paso y comprender aspectos como la organización de los datos, la recuperación de información y el comportamiento de los algoritmos.

---

## 🎯 Objetivo

Desarrollar una aplicación web que permita explorar, configurar y visualizar algoritmos de búsqueda y grafos mediante representaciones gráficas e interactivas.

La aplicación busca complementar la explicación teórica de los algoritmos con una representación visual de su funcionamiento, facilitando la comprensión de los procesos de búsqueda, comparación, recorrido y resolución de problemas.

---

## 📚 Contenido

El proyecto se organiza inicialmente en dos módulos principales:

### 🔎 Búsquedas

Este módulo permite explorar algoritmos de búsqueda en memoria interna y externa.

#### Búsquedas internas

* Búsqueda secuencial
* Búsqueda binaria
* Búsqueda mediante transformación de claves
* Funciones hash
* Manejo de colisiones

Entre las funciones de dispersión contempladas se encuentran:

* Módulo
* Cuadrado
* Truncamiento
* Conversión de bases

Para la resolución de colisiones se contemplan diferentes estrategias, entre ellas:

* Reasignación / exploración lineal
* Exploración cuadrática
* Doble hash
* Arreglos anidados

La aplicación permitirá configurar la estructura de datos, visualizarla y ejecutar los algoritmos mostrando su comportamiento durante el proceso.

#### Búsquedas externas

Este módulo estará orientado a los algoritmos de búsqueda y recuperación de información asociados con memoria secundaria y archivos.

---

### 🕸️ Grafos

El segundo módulo estará orientado al estudio y visualización de grafos.

Entre los contenidos contemplados por la asignatura se encuentran:

* Conceptos básicos de grafos
* Representación de grafos
* Operaciones entre grafos
* Árboles como grafos
* Árboles de expansión
* Algoritmos de Prim y Kruskal
* Conjuntos de corte
* Matrices de representación
* Estructuras de adyacencia
* Coloreado y particionamiento
* Pareamientos
* Envolventes

El módulo se desarrollará progresivamente de acuerdo con los contenidos abordados durante el curso.

---

## ✨ Características

La aplicación está diseñada para permitir:

* Seleccionar el módulo de estudio.
* Configurar estructuras de datos.
* Definir el tamaño de las estructuras.
* Generar o ingresar datos.
* Visualizar las estructuras de manera gráfica.
* Ejecutar algoritmos de búsqueda.
* Visualizar el proceso de ejecución paso a paso.
* Observar resultados y comparaciones realizadas.
* Analizar la complejidad de los algoritmos.
* Seleccionar diferentes estrategias para resolver colisiones en tablas hash.
* Visualizar estructuras de grafos.
* Explorar posteriormente algoritmos aplicados sobre grafos.

---

## 🖥️ Arquitectura general

La aplicación está organizada en módulos independientes para separar:

* Interfaz de usuario.
* Lógica de los algoritmos.
* Estructuras de datos.
* Componentes visuales.
* Utilidades.
* Documentación.

Esta separación busca facilitar el mantenimiento, reutilización y ampliación del proyecto durante el desarrollo de la asignatura.

---

## 🛠️ Tecnologías

### Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3

### Control de versiones

* Git
* GitHub

### Persistencia

Inicialmente se contempla el uso de almacenamiento local del navegador cuando sea necesario.

---

## 📁 Estructura del proyecto

```text
CC2/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── algorithms/
│   │   ├── dataStructures/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│
├── docs/
│   ├── diagrams/
│   ├── requirements/
│   └── project/
│
├── .gitignore
└── README.md
```

---

## 🚧 Estado del proyecto

El proyecto se encuentra actualmente en fase inicial de desarrollo.

### Fase 1 — Diseño y arquitectura

* [x] Creación del repositorio
* [x] Definición inicial de la arquitectura
* [ ] Diseño de la interfaz
* [ ] Implementación de navegación
* [ ] Diseño del módulo de búsquedas
* [ ] Diseño del módulo de grafos

### Fase 2 — Búsquedas

* [ ] Estructura configurable de memoria
* [ ] Búsqueda secuencial
* [ ] Búsqueda binaria
* [ ] Transformación de claves
* [ ] Funciones hash
* [ ] Manejo de colisiones
* [ ] Visualización paso a paso
* [ ] Análisis de complejidad

### Fase 3 — Búsquedas externas e índices

* [ ] Búsquedas en memoria secundaria
* [ ] Índices para archivos
* [ ] Índices primarios
* [ ] Índices secundarios
* [ ] Índices multinivel
* [ ] Análisis de accesos a disco

### Fase 4 — Grafos

* [ ] Representación de grafos
* [ ] Matriz de adyacencia
* [ ] Estructura de adyacencia
* [ ] Operaciones entre grafos
* [ ] Árboles de expansión
* [ ] Prim
* [ ] Kruskal
* [ ] Conjuntos de corte
* [ ] Coloreado y particionamiento
* [ ] Pareamientos
* [ ] Envolventes

### Fase 5 — Documentación y presentación

* [ ] Diagramas UML
* [ ] Diagramas de casos de uso
* [ ] Documentación técnica
* [ ] Manual de usuario
* [ ] Pruebas
* [ ] Preparación de presentación

---

## 📖 Contexto académico

El proyecto se desarrolla en el contexto de la asignatura **Ciencias de la Computación II**, cuyo propósito incluye la implementación computacional de estructuras, la organización y recuperación de información y el análisis de algoritmos.

Los conocimientos previos contemplados por la asignatura incluyen programación básica, matemáticas discretas y Ciencias de la Computación I.

---

## 👩‍💻 Autora

**Geraldine Alejandra Vargas Moreno**

Ingeniería de Sistemas
Universidad Distrital Francisco José de Caldas

---

## 📄 Licencia

Proyecto desarrollado con fines académicos.
