<div align="center">
🏴‍☠️ Nakama Blog
Análisis de anime y manga que van más allá de la pantalla. Y un secreto escondido, esperando a quien sepa buscarlo.

Web Mostrar imagen Mostrar imagen Licencia MIT

👉 Entrar a Nakama Blog 👈
</div>
¿Qué es Nakama Blog?
Nakama Blog es un blog personal de artículos de opinión sobre anime y manga, escrito desde una idea: las grandes obras japonesas no son «solo dibujos». Hablan de guerra, esclavitud, capitalismo, salud mental, libertad o justicia con una honestidad que muchas veces no encontramos en otros medios.

La tesis que atraviesa todo el blog es clara: One Piece es la obra magna audiovisual del planeta, y hoy hay gente que la usa para señalar injusticias reales y hacer que otros abran los ojos. Si solo vas a leer un artículo, que sea este: ➡️ Por qué One Piece es la mayor obra literaria que ha creado el ser humano

Pero Nakama Blog tiene dos capas:

📖 El blog	Artículos de análisis, un ranking personal y la historia de quién hay detrás.
🥚 El juego	10 easter eggs escondidos por toda la web. Al completarlos llega una recompensa… y dentro de ella, un secreto que solo encontrarás si sabes algo de ciberseguridad, criptografía y esteganografía.
📚 Qué vas a encontrar
Artículos
Obra	De qué va el análisis
One Piece	La esclavitud y el colonialismo, el tema que nadie esperaba en un manga
Hunter x Hunter	Las Hormigas Quimera como crítica al capitalismo y a la humanidad
Vinland Saga	El manga que ha retratado la guerra con más honestidad
Shingeki no Kyojin	Libertad y prisión como metáfora política
Naruto	El ciclo del odio: ¿por qué no podemos parar las guerras?
Death Note	¿Quién tiene derecho a decidir quién vive?
Jujutsu Kaisen	Las maldiciones como emociones: una lectura psicológica
Boku no Hero	Qué significa ser un héroe y la trampa del mérito
Dragon Ball	El culto al esfuerzo: cuándo trabajar duro ya no basta
Berserk	El claroscuro del alma humana y la rebelión contra el destino
Oyasumi Punpun	La desoladora verdad de crecer
Chainsaw Man	Caos narrativo y deconstrucción del héroe shōnen
Kimetsu no Yaiba	Una estructura clásica elevada por el arte ukiyo-e
Mob Psycho 100	El poder no mide lo que vales como persona
Haikyu!!	Por qué el deporte es el mejor maestro del alma humana
Black Clover	La voluntad inquebrantable
Vagabond	La espada como camino hacia la iluminación
La lista sigue creciendo.

Y además
🏆 Ranking personal: mi top de obras, 100 % subjetivo y sin disculpas.
👤 Sobre mí: quién escribe esto y por qué.
🔎 Buscador (Ctrl + K): busca dentro del texto de todos los artículos, con o sin tildes.
🔖 Guardados: guarda artículos para leerlos luego. Sin cuentas: todo se queda en tu navegador.
❤️ Me gusta, guardar y compartir en cada artículo.
📑 Lectura cómoda: barra de progreso, índice automático y artículos relacionados.
🌍 8 idiomas: español, inglés, francés, japonés, italiano, alemán, ruso y portugués.
🌗 Tema claro y oscuro.
📱 Instalable como app (PWA): lo que ya hayas leído sigue disponible sin conexión.
📰 RSS: /feed.xml para enterarte de cada artículo nuevo.
🥚 El reto: 10 easter eggs y un secreto
Por toda la web hay 10 easter eggs inspirados en distintos animes. No todos se activan igual: unos se escriben, otros se provocan y otros hay que buscarlos con la mirada.

Pulsa el botón 🥚 de la barra de navegación para abrir el panel de progreso. Verás una pista por cada huevo; su nombre se revela cuando lo descubres.
Tu progreso se guarda en tu navegador, así que puedes ir poco a poco.
Cuando completes los 10… mejor lo compruebas tú mismo.
…pero la recompensa no es el final
Encontrar los 10 huevos es solo la primera mitad del viaje. La recompensa esconde más de lo que se ve a simple vista. Para llegar al secreto final vas a necesitar nociones básicas de:

🛡️ Ciberseguridad	Pensar como un analista: observar, inspeccionar y no fiarte de lo evidente.
🔐 Criptografía	Saber que la información puede protegerse con claves y cifrados, y cómo trabajar con ellos.
🖼️ Esteganografía	El arte de esconder información dentro de otra, sin que nadie note que está ahí.
Las reglas del nakama
El código es público y puedes leerlo. Esto es un reto de ciberseguridad y el reconocimiento también forma parte del juego. Aun así, la gracia está en recorrer el camino como un verdadero nakama.
No necesitas atacar ni forzar nada: ni la web, ni GitHub, ni ningún servidor. El reto se resuelve con lo que la propia web te da.
No publiques la solución (ni en issues, ni en redes). Presume del logro, no del secreto: deja que cada uno viva su propia aventura.
<details> <summary><b>💡 Pistas (ábrelas solo si te atascas)</b></summary> <br>
Pista 1: cuando la recompensa es un archivo, el archivo también es parte del reto.

Pista 2: una imagen JPG puede llevar datos que ningún visor te va a enseñar. Existen herramientas libres de línea de comandos pensadas justo para esconderlos… y para sacarlos.

</details>
🛠️ Cómo está hecho
Un sitio 100 % estático, sin frameworks ni dependencias, servido desde GitHub Pages.

HTML, CSS y JavaScript vanilla (ES6+, sin transpilar ni empaquetar).
Contenido separado del código: cada artículo es un JSON en articles/ con sus 8 idiomas, y los textos de la interfaz viven en locales/.
Generación estática casera (Node, en scripts/): crea una página HTML real por artículo e idioma con URLs limpias (/articulos/<id>/, /articulos/<id>/en/…), la portada de cada idioma, el índice del buscador, el feed RSS y el sitemap.xml.
SEO: Open Graph, Twitter Cards, datos estructurados JSON-LD, hreflang y canonical en cada página.
PWA: manifest + service worker (red primero para no servir nunca contenido viejo; caché para leer sin conexión).
Easter eggs: módulo independiente en easter-eggs/.
├── index.html · article.html · guardados.html   → plantillas de las páginas
├── script.js · styles.css                        → lógica y estilos de toda la web
├── articles/          → artículos (JSON) + índice del buscador
├── articulos/ en/ fr/ ja/ it/ de/ ru/ pt/ guardados/   → páginas generadas
├── locales/           → textos de la interfaz (8 idiomas)
├── easter-eggs/       → el juego 🥚
├── scripts/           → generadores estáticos
├── img/ · videos/ · flags/
└── sw.js · manifest.webmanifest · feed.xml · sitemap.xml
Ejecutarlo en local
Hay que servirlo por HTTP (abrir los .html con doble clic no funciona, porque la web carga JSON con fetch):

python -m http.server 8000
Y abre http://localhost:8000.

Regenerar las páginas estáticas
Después de añadir o editar artículos:

node scripts/generate-search-index.js && node scripts/generate-articles.js && node scripts/generate-home.js && node scripts/generate-saved.js && node scripts/generate-feed.js && node scripts/generate-sitemap.js
Para crear un artículo nuevo hay un asistente: node scripts/new-article.js <id> "<Categoría>", y luego node scripts/new-article.js --check <id> para validarlo.

<details> <summary>🇬🇧 <b>In English</b></summary> <br>
Nakama Blog is a personal blog of opinion pieces on anime and manga, available in 8 languages. It looks at how great Japanese works deal with war, slavery, capitalism, mental health, freedom and justice, and argues that One Piece is the greatest audiovisual work on the planet.

It also hides a game: 10 anime-themed easter eggs scattered across the site (open the 🥚 button in the navbar to track your progress). Finding them all unlocks a reward, but the reward is only half the journey. Reaching the final secret takes some basic knowledge of cybersecurity, cryptography and steganography.

Rules: you can read the code, you never need to attack anything, and please don't publish the solution.

👉 Visit Nakama Blog

</details>
📄 Licencia
El proyecto se distribuye bajo licencia MIT; consulta LICENSE.

Las obras analizadas, sus personajes e imágenes pertenecen a sus respectivos autores y editoriales, y aparecen aquí solo con fines de análisis y crítica.

<div align="center">
Hecho con ❤️ y demasiadas horas de anime por @ualjlf259

¿Eres un verdadero nakama? Demuéstralo. 🏴‍☠️

</div>
