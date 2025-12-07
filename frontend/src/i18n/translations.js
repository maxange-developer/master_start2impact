/**
 * Translation Strings - Multi-language Support
 *
 * Comprehensive translation object for all app text content.
 * Organized by language code and logical feature sections.
 *
 * Structure:
 * translations
 * ├── es (Spanish - default)
 * ├── en (English)
 * ├── it (Italian)
 * ├── de (German)
 * └── fr (French)
 *
 * Sections per language:
 * - landing: Landing page content
 * - nav: Navigation labels
 * - auth: Login/register forms
 * - home: Home dashboard
 * - aiSearch: AI search interface
 * - blog: Blog listing and articles
 * - saved: Saved articles page
 * - create: Article creation form
 * - common: Shared UI text (buttons, errors, etc.)
 *
 * Usage:
 * ```jsx
 * const { t } = useLanguage();
 * <h1>{t('landing.title')}</h1>
 * ```
 *
 * Technical Notes:
 * - Keys use dot notation for nested access
 * - All strings should be present in all languages
 * - Spanish (ES) is primary language for Tenerife context
 */

export const translations = {
  es: {
    // Landing Page
    landing: {
      title: "Descubre Tenerife",
      subtitle: "Tu asistente inteligente para explorar la isla",
      features: {
        ai: {
          title: "Búsqueda con IA",
          description:
            "Encuentra actividades personalizadas con inteligencia artificial",
        },
        blog: {
          title: "Blog de Viajes",
          description: "Artículos y consejos sobre Tenerife",
        },
        saved: {
          title: "Guarda tus Favoritos",
          description: "Organiza tus actividades preferidas",
        },
      },
      cta: {
        login: "Iniciar Sesión",
        register: "Registrarse",
      },
    },
    // Navigation
    nav: {
      home: "Inicio",
      aiSearch: "Búsqueda IA",
      blog: "Blog",
      saved: "Guardados",
      create: "Crear Artículo",
      logout: "Cerrar Sesión",
    },
    // Auth
    auth: {
      login: {
        title: "Iniciar Sesión",
        email: "Correo electrónico",
        password: "Contraseña",
        button: "Entrar",
        noAccount: "¿No tienes cuenta?",
        register: "Regístrate aquí",
      },
      register: {
        title: "Registrarse",
        username: "Nombre de usuario",
        email: "Correo electrónico",
        password: "Contraseña",
        button: "Crear cuenta",
        hasAccount: "¿Ya tienes cuenta?",
        login: "Inicia sesión aquí",
      },
    },
    // Home
    home: {
      welcome: "Bienvenido",
      quickActions: "Acciones Rápidas",
      recentArticles: "Artículos Recientes",
      stats: {
        articles: "Artículos",
        saved: "Guardados",
      },
    },
    // AI Search
    aiSearch: {
      title: "Búsqueda IA",
      subtitle: "Describe lo que buscas",
      placeholder: "Quiero un paseo en barco relajante...",
      startSearch: "Iniciar Búsqueda IA",
      searching: "La IA está buscando para ti...",
      popular: "Los más populares:",
      reset: "Restablecer Búsqueda",
      noResults:
        "No se encontraron resultados. Intenta una búsqueda diferente.",
      offTopic: {
        title: "¡Ups! Hablemos de Tenerife",
        message:
          "Lo siento, pero solo puedo ayudarte con información sobre Tenerife. ¡Intenta buscar actividades, lugares o experiencias para vivir en Tenerife!",
        newSearch: "Nueva Búsqueda",
      },
      progress: {
        analyzing: "Analizando la solicitud...",
        searching: "Buscando las mejores actividades...",
        images: "Encontrando imágenes relevantes...",
        ready: "Casi listo...",
      },
      suggestions: [
        "Mejores puestas de sol y miradores",
        "Actividades económicas para familias",
        "Tour en barco avistamiento de ballenas",
        "Excursiones en el Parque del Teide",
        "Playas tranquilas norte",
        "Restaurantes típicos canarios",
        "Senderismo en el bosque de Anaga",
        "Snorkel y buceo",
        "Parques acuáticos y diversión",
        "Deportes acuáticos Costa Adeje",
        "Vida nocturna y clubes",
        "Mercadillos locales y compras",
        "Yoga y bienestar",
        "Museos y cultura",
        "Actividades gratuitas",
        "Tours enogastronómicos",
      ],
      details: {
        estimatedPrice: "Precio estimado",
        visitSite: "Visitar el Sitio",
        searchDetails: "Buscar Información Detallada",
        searchGoogle: "Buscar en Google",
      },
    },
    // Blog
    blog: {
      title: "Blog",
      subtitle: "Explora artículos sobre Tenerife",
      readMore: "Leer más",
      noArticles: "No hay artículos disponibles",
    },
    // Saved Articles
    saved: {
      title: "Artículos Guardados",
      noSaved: "No tienes artículos guardados",
      remove: "Eliminar",
    },
    // Create Article
    create: {
      title: "Escribir Artículo",
      subtitle: "Crea contenido con la IA",
      form: {
        title: "Título del artículo",
        categories: "Categorías",
        createCategory: "Crear",
        image: "Imagen destacada",
        formats: "JPG, PNG, WEBP, AVIF, SVG",
        content: "Contenido",
        generateWithAI: "Generar con IA",
        aiPrompt: "Describe el artículo que quieres crear...",
        generate: "Generar",
        cancel: "Cancelar",
        publish: "Publicar Artículo",
      },
    },
    // Common
    common: {
      free: "Gratis",
      details: "Detalles",
      location: "Ubicación",
      duration: "Duración",
      rating: "Valoración",
      category: "Categoría",
      price: "Precio",
    },
  },
  en: {
    // Landing Page
    landing: {
      title: "Discover Tenerife",
      subtitle: "Your smart assistant to explore the island",
      features: {
        ai: {
          title: "AI Search",
          description:
            "Find personalized activities with artificial intelligence",
        },
        blog: {
          title: "Travel Blog",
          description: "Articles and tips about Tenerife",
        },
        saved: {
          title: "Save your Favorites",
          description: "Organize your preferred activities",
        },
      },
      cta: {
        login: "Login",
        register: "Sign Up",
      },
    },
    // Navigation
    nav: {
      home: "Home",
      aiSearch: "AI Search",
      blog: "Blog",
      saved: "Saved",
      create: "Create Article",
      logout: "Logout",
    },
    // Auth
    auth: {
      login: {
        title: "Login",
        email: "Email",
        password: "Password",
        button: "Sign In",
        noAccount: "Don't have an account?",
        register: "Register here",
      },
      register: {
        title: "Sign Up",
        username: "Username",
        email: "Email",
        password: "Password",
        button: "Create account",
        hasAccount: "Already have an account?",
        login: "Login here",
      },
    },
    // Home
    home: {
      welcome: "Welcome",
      quickActions: "Quick Actions",
      recentArticles: "Recent Articles",
      stats: {
        articles: "Articles",
        saved: "Saved",
      },
    },
    // AI Search
    aiSearch: {
      title: "AI Search",
      subtitle: "Describe what you're looking for",
      placeholder: "I want a relaxing boat trip...",
      startSearch: "Start AI Search",
      searching: "AI is searching for you...",
      popular: "Most popular:",
      reset: "Reset Search",
      noResults: "No results found. Try a different search.",
      offTopic: {
        title: "Oops! Let's talk about Tenerife",
        message:
          "Sorry, but I can only help you with information about Tenerife. Try searching for activities, places, or experiences to live in Tenerife!",
        newSearch: "New Search",
      },
      progress: {
        analyzing: "Analyzing request...",
        searching: "Searching for the best activities...",
        images: "Finding relevant images...",
        ready: "Almost ready...",
      },
      suggestions: [
        "Best sunsets and viewpoints",
        "Budget-friendly family activities",
        "Whale watching boat tour",
        "Teide National Park excursions",
        "Quiet northern beaches",
        "Traditional Canarian restaurants",
        "Anaga forest hiking",
        "Snorkeling and diving",
        "Water parks and fun",
        "Costa Adeje water sports",
        "Nightlife and clubs",
        "Local markets and shopping",
        "Yoga and wellness",
        "Museums and culture",
        "Free activities",
        "Wine and food tours",
      ],
      details: {
        estimatedPrice: "Estimated price",
        visitSite: "Visit Site",
        searchDetails: "Search Detailed Information",
        searchGoogle: "Search on Google",
      },
    },
    // Blog
    blog: {
      title: "Blog",
      subtitle: "Explore articles about Tenerife",
      readMore: "Read more",
      noArticles: "No articles available",
    },
    // Saved Articles
    saved: {
      title: "Saved Articles",
      noSaved: "You have no saved articles",
      remove: "Remove",
    },
    // Create Article
    create: {
      title: "Write Article",
      subtitle: "Create content with AI",
      form: {
        title: "Article title",
        categories: "Categories",
        createCategory: "Create",
        image: "Featured image",
        formats: "JPG, PNG, WEBP, AVIF, SVG",
        content: "Content",
        generateWithAI: "Generate with AI",
        aiPrompt: "Describe the article you want to create...",
        generate: "Generate",
        cancel: "Cancel",
        publish: "Publish Article",
      },
    },
    // Common
    common: {
      free: "Free",
      details: "Details",
      location: "Location",
      duration: "Duration",
      rating: "Rating",
      category: "Category",
      price: "Price",
    },
  },
  it: {
    // Landing Page
    landing: {
      title: "Scopri Tenerife",
      subtitle: "Il tuo assistente intelligente per esplorare l'isola",
      features: {
        ai: {
          title: "Ricerca AI",
          description:
            "Trova attività personalizzate con intelligenza artificiale",
        },
        blog: {
          title: "Blog di Viaggio",
          description: "Articoli e consigli su Tenerife",
        },
        saved: {
          title: "Salva i tuoi Preferiti",
          description: "Organizza le tue attività preferite",
        },
      },
      cta: {
        login: "Accedi",
        register: "Registrati",
      },
    },
    // Navigation
    nav: {
      home: "Home",
      aiSearch: "Ricerca AI",
      blog: "Blog",
      saved: "Salvati",
      create: "Scrivi Articolo",
      logout: "Esci",
    },
    // Auth
    auth: {
      login: {
        title: "Accedi",
        email: "Email",
        password: "Password",
        button: "Entra",
        noAccount: "Non hai un account?",
        register: "Registrati qui",
      },
      register: {
        title: "Registrati",
        username: "Nome utente",
        email: "Email",
        password: "Password",
        button: "Crea account",
        hasAccount: "Hai già un account?",
        login: "Accedi qui",
      },
    },
    // Home
    home: {
      welcome: "Bentornato",
      quickActions: "Azioni Rapide",
      recentArticles: "Articoli Recenti",
      stats: {
        articles: "Articoli",
        saved: "Salvati",
      },
    },
    // AI Search
    aiSearch: {
      title: "Ricerca AI",
      subtitle: "Descrivi cosa stai cercando",
      placeholder: "Voglio una gita in barca rilassante...",
      startSearch: "Inizia Ricerca AI",
      searching: "L'AI sta cercando per te...",
      popular: "I più popolari:",
      reset: "Azzera Ricerca",
      noResults: "Nessun risultato trovato. Prova una ricerca diversa.",
      offTopic: {
        title: "Ops! Parliamo di Tenerife",
        message:
          "Mi dispiace, ma posso aiutarti solo con informazioni su Tenerife. Prova a cercare attività, luoghi o esperienze da vivere a Tenerife!",
        newSearch: "Nuova Ricerca",
      },
      progress: {
        analyzing: "Analizzando la richiesta...",
        searching: "Cercando le migliori attività...",
        images: "Trovando immagini pertinenti...",
        ready: "Quasi pronto...",
      },
      suggestions: [
        "Migliori tramonti e mirador",
        "Attività economiche per famiglie",
        "Tour in barca whale watching",
        "Escursioni nel Parco del Teide",
        "Spiagge tranquille nord",
        "Ristoranti tipici canari",
        "Trekking nella foresta di Anaga",
        "Snorkeling e immersioni",
        "Parchi acquatici e divertimento",
        "Sport acquatici Costa Adeje",
        "Vita notturna e club",
        "Mercatini locali e shopping",
        "Yoga e benessere",
        "Musei e cultura",
        "Attività gratuite",
        "Tour enogastronomici",
      ],
      details: {
        estimatedPrice: "Prezzo stimato",
        visitSite: "Visita il Sito",
        searchDetails: "Cerca Informazioni Dettagliate",
        searchGoogle: "Cerca su Google",
      },
    },
    // Blog
    blog: {
      title: "Blog",
      subtitle: "Esplora articoli su Tenerife",
      readMore: "Leggi di più",
      noArticles: "Nessun articolo disponibile",
    },
    // Saved Articles
    saved: {
      title: "Articoli Salvati",
      noSaved: "Non hai articoli salvati",
      remove: "Rimuovi",
    },
    // Create Article
    create: {
      title: "Scrivi Articolo",
      subtitle: "Crea contenuti con l'AI",
      form: {
        title: "Titolo dell'articolo",
        categories: "Categorie",
        createCategory: "Crea",
        image: "Immagine in evidenza",
        formats: "JPG, PNG, WEBP, AVIF, SVG",
        content: "Contenuto",
        generateWithAI: "Genera con AI",
        aiPrompt: "Descrivi l'articolo che vuoi creare...",
        generate: "Genera",
        cancel: "Annulla",
        publish: "Pubblica Articolo",
      },
    },
    // Common
    common: {
      free: "Gratis",
      details: "Dettagli",
      location: "Località",
      duration: "Durata",
      rating: "Valutazione",
      category: "Categoria",
      price: "Prezzo",
    },
  },
};
