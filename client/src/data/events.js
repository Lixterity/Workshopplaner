export const events = [
  {
    id: 'event-1',
    name: 'Future Facilitation Days',
    date: '2025-05-12',
    location: 'Berlin',
    description:
      'Zwei Tage voller moderner Methoden rund um Workshop-Planung, Teamaktivierung und visuelle Moderation.',
    workshops: [
      {
        id: 'workshop-1',
        name: 'Kreative Warm-ups & Icebreaker',
        description:
          'Entdecke 10 sofort einsetzbare Warm-ups für Hybrid-Teams und erlebe live, wie du Energie in den Raum bringst.',
        date: '2025-05-12T09:00:00',
        duration: '09:00 – 10:30 Uhr',
        room: 'Studio Blau',
        cost: 'Kostenlos',
        targetGroup: 'Für alle Levels',
        hosts: ['Julia Schröder', 'Max Lorenz'],
        participants: ['Lea Müller', 'Jonas Kraus', 'Mila Schneider', 'Timo Berger'],
        capacity: 18
      },
      {
        id: 'workshop-2',
        name: 'Visuelle Dokumentation',
        description:
          'Lerne die Basics des Sketchnotings kennen und dokumentiere Workshops eindrucksvoll für dein Team.',
        date: '2025-05-12T13:30:00',
        duration: '13:30 – 15:00 Uhr',
        room: 'Atelier',
        cost: '49 €',
        targetGroup: 'Fortgeschrittene Moderation',
        hosts: ['Anja Richter'],
        participants: ['Sandra Vogt', 'Kenji Bauer'],
        capacity: 20
      }
    ]
  },
  {
    id: 'event-2',
    name: 'Digital Collaboration Summit',
    date: '2025-06-03',
    location: 'Hamburg',
    description:
      'Ein kompakter Tag mit Fokus auf digitale Tools, Remote Facilitation und Zusammenarbeit über Standorte hinweg.',
    workshops: [
      {
        id: 'workshop-3',
        name: 'Remote Workshops meistern',
        description:
          'Best Practices für die Planung und Moderation virtueller Workshops inkl. Checklisten und Tool-Tipps.',
        date: '2025-06-03T10:00:00',
        duration: '10:00 – 12:00 Uhr',
        room: 'Hafenraum 2',
        cost: '79 €',
        targetGroup: 'Teamleads & Projektmanager',
        hosts: ['Carla Nguyen', 'Sven Hartmann'],
        participants: ['Felix Brandt', 'Lina Walter', 'Nora Reimann', 'Stefan Wolf'],
        capacity: 25
      }
    ]
  }
]

export function findEvent(eventId) {
  return events.find(event => event.id === eventId)
}

export function findWorkshop(eventId, workshopId) {
  const event = findEvent(eventId)
  if (!event) {
    return { event: undefined, workshop: undefined }
  }

  return {
    event,
    workshop: event.workshops.find(item => item.id === workshopId)
  }
}
