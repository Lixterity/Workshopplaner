export const events = [
  {
    id: 'event-1',
    name: 'IT-Hackathon: Code & Create',
    date: '2025-11-28',
    location: 'IT-Forum Gymnasium',
    description:
      '24‑Stunden-Hackathon für Schüler:innen: Kleine Teams entwickeln Prototypen zu realen Aufgabenstellungen.',
    workshops: [
      {
        id: 'workshop-1',
        name: 'Kickoff & Team-Forming',
        description: 'Ideenfindung, Teambuilding und Setup der Entwicklungsumgebung.',
        date: '2025-11-28',
        duration: '10:00 – 12:00',
        room: 'Konferenzraum 1',
        cost: 'Kostenlos',
        targetGroup: 'Alle Jahrgänge',
        hosts: ['Mentor-Team'],
        participants: ['Lukas Iveljic', 'Matteo Knogler', 'Sayed Sadat'],
        capacity: 60
      },
      {
        id: 'workshop-2',
        name: 'Pitch-Training',
        description: 'Kurzworkshop: Wie präsentiere ich meinen Prototypen in 3 Minuten?',
        date: '2025-11-29',
        duration: '09:00 – 10:00',
        room: 'Aula',
        cost: 'Kostenlos',
        targetGroup: 'Teilnehmende Hackathon-Teams',
        hosts: ['Gastjury'],
        participants: [],
        capacity: 100
      }
    ]
  },
  {
    id: 'event-2',
    name: 'Cybersecurity Day',
    date: '2025-12-10',
    location: 'Campus Lab',
    description:
      'Ein Tag rund um Sicherheit: Grundlagen der IT-Sicherheit, einfache Angriffs-Szenarien und Verteidigungsmaßnahmen.',
    workshops: [
      {
        id: 'workshop-3',
        name: 'Einführung in Cybersecurity',
        description: 'Passwörter, Verschlüsselung und sichere Kommunikation — praxisnah erklärt.',
        date: '2025-12-10',
        duration: '09:00 – 10:30',
        room: 'Lab 2',
        cost: 'Kostenlos',
        targetGroup: 'Klassen 9–12',
        hosts: ['Sicherheits-Team'],
        participants: ['Lukas Iveljic'],
        capacity: 30
      },
      {
        id: 'workshop-4',
        name: 'Praktische Forensik-Session',
        description: 'Untersuchung eines simulierten Vorfalls; Spuren finden und dokumentieren.',
        date: '2025-12-10',
        duration: '11:00 – 13:00',
        room: 'Forensik-Lab',
        cost: 'Kostenlos',
        targetGroup: 'Fortgeschrittene',
        hosts: ['Herr Becker'],
        participants: ['Sayed Sadat'],
        capacity: 12
      }
    ]
  },
  {
    id: 'event-3',
    name: 'Betriebsbesuch: Cloud-Anbieter',
    date: '2026-01-20',
    location: 'TechCampus GmbH (Exkursion)',
    description:
      'Exkursion zu einem regionalen Cloud-Provider: Einblicke in Rechenzentren, DevOps-Prozesse und Karrierewege.',
    workshops: [
      {
        id: 'workshop-5',
        name: 'Rechenzentrumstour & Talk',
        description: 'Geführte Tour durch Rechenzentrumstechnik und Einblicke in Betriebsabläufe.',
        date: '2026-01-20',
        duration: '10:00 – 12:00',
        room: 'Onsite',
        cost: 'Busfahrt (gefördert)',
        targetGroup: 'Interessierte Schüler:innen',
        hosts: ['TechCampus-Team'],
        participants: ['Matteo Knogler'],
        capacity: 40
      }
    ]
  },
  {
    id: 'event-4',
    name: 'Data Science Workshop & Fieldtrip',
    date: '2026-02-14',
    location: 'Uni-Lab / Data Center',
    description:
      'Einführung in Datenanalyse, einfache ML-Modelle und Besuch eines Uni-Data-Labs.',
    workshops: [
      {
        id: 'workshop-6',
        name: 'Intro Data Analysis (Python)',
        description: 'Pandas, einfache Visualisierungen und ein Mini-Projekt mit realen Datensätzen.',
        date: '2026-02-14',
        duration: '09:00 – 11:30',
        room: 'Uni-Lab 3',
        cost: 'Kostenlos',
        targetGroup: 'Klassen 10–12',
        hosts: ['Dr. Schmitt'],
        participants: ['Lukas Iveljic', 'Matteo Knogler'],
        capacity: 24
      },
      {
        id: 'workshop-7',
        name: 'Uni-Data-Lab Besuch',
        description: 'Kurze Vorstellung der Forschung und Laborführung.',
        date: '2026-02-14',
        duration: '12:30 – 14:00',
        room: 'Data Center',
        cost: 'Kostenlos',
        targetGroup: 'Teilnehmende des Workshops',
        hosts: ['Uni-Team'],
        participants: ['Sayed Sadat'],
        capacity: 20
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
