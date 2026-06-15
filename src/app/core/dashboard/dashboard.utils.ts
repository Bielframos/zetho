export const DASHBOARD_ENTRIES = [
  {
    key: 'totalsBacklog',
    label: 'Biblioteca',
    icon: 'ph-fill ph-books text-[28px]',
    classes: 'max-md:border-b max-md:border-r',
    tab: 'backlog',
  },
  {
    key: 'totalsPlaying',
    label: 'Jogando',
    icon: 'ph-fill ph-game-controller text-[28px]',
    classes: 'max-md:border-b',
    tab: 'playing',
  },
  {
    key: 'totalsDropped',
    label: 'Dropados',
    icon: 'ph-fill ph-x-circle text-[28px]',
    classes: 'max-md:border-r',
    tab: 'dropped',
  },
  {
    key: 'totalsWishlist',
    label: 'Wishlist',
    icon: 'ph-fill ph-list-star text-[28px]',
    classes: '',
    tab: 'wishlist',
  },
] as const;
