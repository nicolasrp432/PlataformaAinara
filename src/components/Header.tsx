import type { FC } from 'react'

interface HeaderProps {
  activePage?: 'dashboard' | 'quest' | 'taberna' | 'library' | 'mentorship'
  userName?: string
  userAvatar?: string
}

export const Header: FC<HeaderProps> = ({ 
  activePage = 'dashboard',
  userName = 'Alex Rivera',
  userAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNdBJQPBPuZzg_l9QbMtcvwyTyOHMpxnFgtK5Y9dd2-KLLVd8ooHk-XqzeTxf_hPZGsbBinasntYS2Yw51dmN75ddg4l12SX5CD1R_EvzMDpYoTaV9Pznl5TYtRz2SmN_Wz5ZoV88yTbCqdNDCAduxz_TLX61dH-kuabcSVvsLE5Apwo27DoWPC41ChSoTf06Pw3kZt57RJPzM0r6FTlE2ldGYinPbpM-HG4pMEsH9zcaekXxSJHurYqHv28CbOcELvpTRcTpVOdwl'
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'library', label: 'Biblioteca', href: '/library' },
    { id: 'taberna', label: 'La Taberna', href: '/taberna' },
    { id: 'mentorship', label: 'Mentoría', href: '/mentorship' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 px-6 lg:px-12 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md">
      <div className="flex items-center gap-10">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white font-bold text-lg">architecture</span>
          </div>
          <h2 className="text-charcoal text-xl font-bold tracking-tight">Leader Blueprint</h2>
        </a>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a 
              key={item.id}
              href={item.href}
              className={`text-sm font-semibold transition-colors ${
                activePage === item.id 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden lg:flex items-center bg-soft-bg rounded-lg px-3 py-1.5 w-64 border border-gray-100 focus-within:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-charcoal-muted text-xl">search</span>
          <input 
            type="text"
            placeholder="Buscar insights..." 
            className="bg-transparent border-none focus:ring-0 text-sm text-charcoal placeholder:text-charcoal-muted/50 w-full"
          />
        </div>
        
        <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
          {/* Notifications */}
          <button className="text-charcoal-muted hover:text-charcoal transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full"></span>
          </button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-primary/20"
              style={{ backgroundImage: `url("${userAvatar}")` }}
            />
            <span className="hidden sm:inline text-sm font-medium text-charcoal">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
