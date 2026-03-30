export enum MembershipType {
    ACTIVE = 'a',
    PASSIVE = 'p',
}

export enum gender {
    MALE = 'm',
    FEMALE = 'w',
    DIVERSE = 'd',
}

export enum PlayClassification {
    A_JUGEND = 'A-Jugend',
    B_JUGEND = 'B-Jugend',
    C_JUGEND = 'C-Jugend',
    D_JUGEND = 'D-Jugend',
    E_JUGEND = 'E-Jugend',
    F_JUGEND = 'F-Jugend',
    G_JUGEND = 'G-Jugend',
}

export enum TypeOfApplication {
    FIRST_ISSUE = 1,
    CLUB_CHANGE = 2,
    PLAYER_FROM_FOREIGN_COUNTRY = 3,
    SECOND_COPY = 4,
}

export enum CheckType {
    BIRTH_CERTIFICATE = 1,
    CERTIFICATION_BY_OFFICE = 2,
    COPY_OF_BIRTH_CERTIFICATE = 3,
}

export enum RegistrationStatus {
  NEW = 'NEW',                          // Neu
  WAITING_UPLOAD = 'WAITING_UPLOAD',    // Wartet auf Upload der Unterlagen
  IN_PROGRESS = 'IN_PROGRESS',          // In Bearbeitung (beim Verein)
  WAITING_KREIS = 'WAITING_KREIS',      // Warten auf Bearbeitung beim Kreis
  PAUSED = 'PAUSED',                    // Rückfragen / Bearbeitung pausiert
  REFUSED = 'REFUSED',                  // Abgelehnt
  SUBMITTED = 'SUBMITTED',              // Spielberechtigung beantragt (an Kreis/Verband übermittelt)
  DONE = 'DONE',                        // Abgeschlossen (Spielberechtigung erteilt)
}
