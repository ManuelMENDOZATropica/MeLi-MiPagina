# Landing Builder / MeLi MiPagina

Landing Builder o MeLi MiPagina, es una herramienta interna diseñada para que el equipo de Trópica pueda maquetar páginas de Mercado Libre de forma rápida y compartir prototipos navegables con los clientes.

A continuación se describen las características principales y la arquitectura técnica del sistema:

## 1. Propósito y Flujo de Trabajo
El sistema permite al equipo crear proyectos de "landings" donde se pueden organizar componentes visuales que respetan las guías de estilo y dimensiones oficiales de Mercado Libre. Estos componentes son interactivos y permiten previsualizar cómo se vería la página final tanto en escritorio como en dispositivos móviles.

## 2. Características Principales del Editor
* **Biblioteca de Componentes MeLi**: Incluye una lista predefinida de elementos como encabezados (portada + logo), banners principales (grandes, pequeños, flotantes), banners secundarios, listas de contenido, carruseles de categorías, galerías y videos.

* **Composición Avanzada por Nodos (Capas)**: Una funcionalidad única del proyecto es el Editor de Nodos integrado. Utiliza `@xyflow/react` para permitir que el usuario cree composiciones de imágenes complejas mediante nodos de "capas", donde cada imagen puede ser movida, redimensionada o rotada individualmente con la librería `react-moveable` antes de ser renderizada en el componente final.

* **Responsive Design Real**: El editor permite alternar entre vistas de Desktop (1920px) y Mobile (375px). Los componentes tienen tamaños específicos y "Áreas Seguras" visualizables para asegurar que el contenido crítico no se corte en los dispositivos reales.

* **Modo "Go Live" (Preview)**: Permite ocultar todas las herramientas de edición para presentar al cliente una versión limpia y navegable de la landing.

## 3. Gestión y Colaboración
* **Panel de Proyectos**: Los usuarios pueden gestionar múltiples maquetas (crear, renombrar, eliminar) desde un dashboard centralizado.

* **Autenticación Corporativa**: El acceso está restringido estrictamente a cuentas con el dominio `@tropica.me` mediante Google OAuth.

* **Persistencia y Auto-guardado**: El sistema guarda automáticamente los cambios en el layout, las posiciones de los nodos y los textos editados cada pocos segundos para evitar pérdida de información.

## 4. Stack Tecnológico
* **Frontend**: Construido con React y Vite. Utiliza Tailwind CSS para los estilos y Lucide React para la iconografía.
* **Backend**: Un servidor en Node.js con Express que gestiona la API REST y la autenticación mediante JWT.
* **Base de Datos**: Utiliza PostgreSQL y el ORM Prisma para manejar los modelos de usuarios y proyectos.
* **Contenerización**: Incluye configuración de Docker Compose para levantar fácilmente una instancia local de la base de datos.
