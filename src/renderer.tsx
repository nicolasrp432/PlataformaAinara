import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html class="light" lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Leader Blueprint | Plataforma de Formación Premium'}</title>
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Material Symbols */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: {
                  "primary": "#C5A059",
                  "primary-dark": "#A6823B",
                  "luxury-gold": "#D4AF37",
                  "luxury-ivory": "#FDFCFB",
                  "luxury-slate": "#2C3E50",
                  "charcoal": "#2D2D2D",
                  "charcoal-muted": "#666666",
                  "background-light": "#FFFFFF",
                  "soft-bg": "#F9F9F7",
                },
                fontFamily: {
                  "serif": ["Playfair Display", "serif"],
                  "display": ["Manrope", "sans-serif"],
                  "sans": ["Manrope", "sans-serif"]
                },
                borderRadius: {
                  "DEFAULT": "0.25rem",
                  "lg": "0.5rem",
                  "xl": "0.75rem",
                  "2xl": "1rem",
                  "full": "9999px"
                },
              },
            },
          }
        `}} />
        
        {/* Custom Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: 'Manrope', sans-serif;
            -webkit-font-smoothing: antialiased;
            background-color: #FDFCFB;
          }
          .serif-font {
            font-family: 'Playfair Display', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          .icon-fill {
            font-variation-settings: 'FILL' 1;
          }
          .gold-gradient {
            background: linear-gradient(135deg, #D4AF37 0%, #F1D382 50%, #C5A059 100%);
          }
          .gold-text-gradient {
            background: linear-gradient(135deg, #B8860B 0%, #D4AF37 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero-gradient {
            background: linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%);
          }
          .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(197, 160, 89, 0.1);
          }
          .gold-glow {
            box-shadow: 0 4px 20px rgba(197, 160, 89, 0.15);
          }
          .luxury-shadow {
            box-shadow: 0 4px 20px -2px rgba(236, 182, 19, 0.05);
          }
          
          /* Video Player Controls */
          .video-progress:hover .progress-handle {
            transform: scale(1);
          }
          .progress-handle {
            transform: scale(0);
            transition: transform 0.2s ease;
          }
          
          /* Animations */
          @keyframes pulse-gold {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse-gold {
            animation: pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          /* Scrollbar Styling */
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #C5A059;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #A6823B;
          }
        `}} />
      </head>
      <body class="bg-luxury-ivory text-charcoal min-h-screen">
        {children}
      </body>
    </html>
  )
})
