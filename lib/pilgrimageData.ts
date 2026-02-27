export interface PilgrimagePlace {
  id: string;
  name: string;
  location: string;
  religion: "Hindu" | "Muslim" | "Sikh" | "Buddhist" | "Christian" | "Jain";
  description: string;
  image: string;
  lat: number;
  lng: number;
  significance: string;
  bestTimeToVisit: string;
}

export const pilgrimagePlaces: PilgrimagePlace[] = [
  // Hindu
  {
  id: "yamunotri",
  name: "Yamunotri Temple",
  location: "Uttarkashi, Uttarakhand",
  religion: "Hindu",
  description: "Sacred temple dedicated to Goddess Yamuna and the source of River Yamuna",
  image: "/",
  lat: 31.0140,
  lng: 78.4600,
  significance: "First stop of the Char Dham Yatra and an important site for seeking blessings of Goddess Yamuna",
  bestTimeToVisit: "May to June and September to October",
},

{
  id: "gangotri",
  name: "Gangotri Temple",
  location: "Uttarkashi, Uttarakhand",
  religion: "Hindu",
  description: "Sacred shrine dedicated to Goddess Ganga, origin point of the River Ganges",
  image: "/",
  lat: 30.9947,
  lng: 78.9398,
  significance: "Second stop of the Char Dham Yatra and sacred source of the holy River Ganga",
  bestTimeToVisit: "May to June and September to October",
},

{
  id: "kedarnath",
  name: "Kedarnath Temple",
  location: "Rudraprayag, Uttarakhand",
  religion: "Hindu",
  description: "Ancient temple dedicated to Lord Shiva and one of the twelve Jyotirlingas",
  image: "/kedarnath.jpeg",
  lat: 30.7352,
  lng: 79.0669,
  significance: "One of the holiest Shiva temples and a major pilgrimage site in the Himalayas",
  bestTimeToVisit: "May to June and September to October",
},

{
  id: "badrinath",
  name: "Badrinath Temple",
  location: "Chamoli, Uttarakhand",
  religion: "Hindu",
  description: "Sacred temple dedicated to Lord Vishnu in his form as Badrinarayan",
  image: "/",
  lat: 30.7433,
  lng: 79.4938,
  significance: "Final stop of the Char Dham Yatra and one of the most important Vaishnav pilgrimage sites in India",
  bestTimeToVisit: "May to June and September to October",
},

  {
    id: "varanasi",
    name: "Kashi Vishwanath Temple",
    location: "Varanasi, Uttar Pradesh",
    religion: "Hindu",
    description: "One of the twelve Jyotirlingas, the most sacred Shiva temple",
    image: "/",
    lat: 25.3176,
    lng: 82.9739,
    significance: "Holiest of Hindu pilgrimage sites on the banks of Ganges",
    bestTimeToVisit: "October to March",
  },
  {
    id: "tirupati",
    name: "Tirumala Venkateswara Temple",
    location: "Tirupati, Andhra Pradesh",
    religion: "Hindu",
    description: "Richest and most visited temple dedicated to Lord Venkateswara",
    image: "/",
    lat: 13.6833,
    lng: 79.3472,
    significance: "Abode of Lord Venkateswara, believed to grant wishes",
    bestTimeToVisit: "September to February",
  },
  {
    id: "golden-temple",
    name: "Harmandir Sahib (Golden Temple)",
    location: "Amritsar, Punjab",
    religion: "Sikh",
    description: "The most sacred Gurdwara of Sikhism",
    image: "/",
    lat: 31.6200,
    lng: 74.8765,
    significance: "Spiritual and cultural center of Sikhism",
    bestTimeToVisit: "November to March",
  },
  {
    id: "bodh-gaya",
    name: "Mahabodhi Temple",
    location: "Bodh Gaya, Bihar",
    religion: "Buddhist",
    description: "Place where Buddha attained enlightenment",
    image: "/",
    lat: 24.6958,
    lng: 84.9910,
    significance: "Most sacred site in Buddhism, UNESCO World Heritage",
    bestTimeToVisit: "October to March",
  },
  {
    id: "ajmer-sharif",
    name: "Ajmer Sharif Dargah",
    location: "Ajmer, Rajasthan",
    religion: "Muslim",
    description: "Sufi shrine of Moinuddin Chishti",
    image: "/",
    lat: 26.4499,
    lng: 74.6399,
    significance: "One of the holiest Islamic shrines in India",
    bestTimeToVisit: "October to March",
  },
  {
    id: "jagannath-puri",
    name: "Jagannath Temple",
    location: "Puri, Odisha",
    religion: "Hindu",
    description: "Famous for the annual Rath Yatra festival",
    image: "/",
    lat: 19.8135,
    lng: 85.8312,
    significance: "Part of Char Dham, dedicated to Lord Jagannath",
    bestTimeToVisit: "October to March",
  },
  {
    id: "rameshwaram",
    name: "Ramanathaswamy Temple",
    location: "Rameswaram, Tamil Nadu",
    religion: "Hindu",
    description: "One of the twelve Jyotirlinga temples",
    image: "/",
    lat: 9.2876,
    lng: 79.3129,
    significance: "Part of Char Dham, where Lord Rama worshipped Shiva",
    bestTimeToVisit: "October to April",
  },
  {
    id: "dwarka",
    name: "Dwarkadhish Temple",
    location: "Dwarka, Gujarat",
    religion: "Hindu",
    description: "Ancient Krishna temple, part of Char Dham",
    image: "/",
    lat: 22.2442,
    lng: 68.9685,
    significance: "Kingdom of Lord Krishna",
    bestTimeToVisit: "October to March",
  },
  {
    id: "velankanni",
    name: "Basilica of Our Lady of Good Health",
    location: "Velankanni, Tamil Nadu",
    religion: "Christian",
    description: "Major Catholic pilgrimage site",
    image: "https://images.unsplash.com/photo-1548625149-720134d51a3e?w=500",
    lat: 10.6833,
    lng: 79.8500,
    significance: "Miracles attributed to Virgin Mary",
    bestTimeToVisit: "August to September",
  },
  {
    id: "hemkund-sahib",
    name: "Hemkund Sahib",
    location: "Chamoli, Uttarakhand",
    religion: "Sikh",
    description: "High altitude Sikh pilgrimage site",
    image: "/",
    lat: 30.7268,
    lng: 79.7325,
    significance: "Where Guru Gobind Singh meditated",
    bestTimeToVisit: "June to October",
  },
];

export function getPilgrimagesByReligion(religion: string): PilgrimagePlace[] {
  return pilgrimagePlaces.filter((place) => place.religion === religion);
}

export function getAllReligions(): string[] {
  return Array.from(new Set(pilgrimagePlaces.map((place) => place.religion)));
}