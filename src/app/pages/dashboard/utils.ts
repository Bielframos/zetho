export const DASHBOARD_ENTRIES = [
    {
        key: 'totalsBacklog',
        label: 'Backlog',
        icon: 'ph-fill ph-books',
        classes: '@md:border-b @md:border-r border-gray-6',
        tab: 'backlog'
    },
    {
        key: 'totalsPlaying',
        label: 'Jogando',
        icon: 'ph-fill ph-game-controller',
        classes: '@md:border-b border-gray-6',
        tab: 'playing'
    },
    {
        key: 'totalsDropped',
        label: 'Dropados',
        icon: 'ph-fill ph-x-circle',
        classes: '@md:border-r border-gray-6',
        tab: 'dropped'
    },
    {
        key: 'totalsWishlist',
        label: 'Lista de Desejos',
        icon: 'ph-fill ph-list-star',
        classes: '',
        tab: 'wishlist'
    },
] as const;