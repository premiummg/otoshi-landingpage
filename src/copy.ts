// New Brunswick judo, coached in Dieppe: French is not a nice-to-have here,
// it is the first language of a real share of the membership. So `Copy` is a
// real TypeScript type, not a loose Record<string, string> - the FR object
// below is checked against the exact same shape as EN, so the compiler
// refuses to build if a French string is ever missing rather than silently
// falling back to English at runtime.

export const EN = {
  code: 'EN',
  langName: 'English',
  nav: { home: 'Home', about: 'About Otoshi', schedule: 'Schedule', contact: 'Contact Us', cta: 'Join Club Otoshi' },
  hero: {
    eyebrow: 'Martial Art · Greater Moncton',
    title: 'Judo Otoshi',
    sub: 'Find unbreakable confidence and focus, one belt at a time.',
    cta: 'Join Club Otoshi',
    alt: 'See our programs',
    locationLabel: 'Club Location',
    location: '1571 Melanson Rd, Dieppe',
    phoneLabel: 'Call the Dojo',
  },
  community: {
    items: [
      {
        title: 'One Home Dojo, Deep Roots',
        body: 'Training in Dieppe since 2012 – the same coaching staff, the same community, growing every year across the Greater Moncton area.',
      },
      {
        title: 'Certified Judo Instructors',
        body: 'Train under experienced, certified Senseis dedicated to safety, character development, and proven technical instruction.',
      },
      {
        title: 'Family-First Value & Support',
        body: 'We encourage family training with significant multi-sign-up discounts and age-specific classes for total family growth.',
      },
    ],
  },
  programs: {
    eyebrow: 'Judo Classes',
    title: 'A class for every age and skill level.',
    // `long`/`classNames` are new, written for the click-through detail page
    // Malcolm asked about ("like our old website") - the old site is now a
    // private WordPress.com install with no public content left to pull
    // from, so this is fresh copy rather than a recovered original. Worth a
    // pass from Malcolm before it's final, same as the pricing data was.
    // `classNames` links a program to its rows in `schedule.days` (by class
    // name) so the detail page can show exactly when it meets without a
    // second, hand-maintained copy of the schedule.
    items: [
      {
        key: 'beginner', img: 'Beginner.jpg', name: 'Beginner', ages: 'Ages 6–13',
        body: 'New to judo. Falling safely, balance, and the first throws, in a structured and encouraging class.',
        long: [
          'Beginner is where every young judoka starts: classes built around the fundamentals that keep training safe and fun from day one - how to fall without fear, balance, grip, and the first few throws.',
          'Classes are split into two groups (Beginners A and B) so instructors can keep a close eye on technique at this stage, with an emphasis on discipline, respect, and the confidence that comes from getting a new skill right for the first time.',
        ],
        classNames: ['Beginners A', 'Beginners B'],
      },
      {
        key: 'intermediate', img: 'Intermediates-regular.jpg', name: 'Intermediate', ages: 'Ages 8–13',
        body: 'A few years of experience. Building technique and ring craft toward the next belt.',
        long: [
          'Intermediate builds on the fundamentals from Beginner with a wider technical vocabulary - throws, groundwork (newaza), and the tactical sense that turns individual moves into a real judo game.',
          'Students train in two groups (Intermediates A and B), with an optional third weekly session and a conditioning add-on for judoka preparing for their next belt or their first tournaments.',
        ],
        classNames: ['Intermediates A', 'Intermediates B'],
      },
      {
        key: 'elite', img: 'Elites.jpg', name: 'Elite', ages: 'Ages 13+',
        body: 'The competitive program, for judoka training toward tournaments and provincial standards.',
        long: [
          'Elite is the club’s competitive program, for judoka training toward tournaments and provincial standards. Technical work, live randori, and strategy build the conditioning and ring craft competition demands.',
          'Optional conditioning sessions (one or two extra per week) are available for athletes preparing for a heavier competition schedule.',
        ],
        classNames: ['Elites'],
      },
      {
        key: 'adult', img: 'Adults.jpg', name: 'Adult', ages: 'Ages 14+',
        body: 'All levels welcomed. Strength, discipline, and real self-defense, on your own schedule.',
        long: [
          'Adult welcomes every level, from a first-timer walking onto the mat to someone returning to the sport after years away. Classes cover real self-defense, judo’s throws and groundwork, and a serious workout, at whatever pace fits you.',
          'Parents who already have a kid registered at the club get 50% off their own Adult registration.',
        ],
        classNames: ['Adults/Teens'],
      },
    ],
    trial: { title: 'Just getting started?', body: 'Step onto the mat with a free trial and discover Otoshi Judo.', cta: 'Step Onto the Mat' },
    detail: {
      backToPrograms: 'Back to classes',
      whenItMeets: 'When it meets',
      whatToExpect: 'What to expect',
      cta: 'Register for this class',
      notFoundTitle: 'Class not found',
      notFoundBody: 'We couldn’t find that class. Take a look at the full list instead.',
    },
  },
  who: {
    eyebrow: 'Who we are',
    title: 'The meaning behind the name.',
    body: 'In judo, "otoshi" (落とし) means "drop" or "fall" – part of several throwing techniques, including Tai Otoshi (body drop) and Tani Otoshi (valley drop), classified as Sutemi Waza, sacrifice techniques.',
    body2: 'Founded in Dieppe in 2012, Otoshi has grown into a community of more than 200 judoka, coached by eight certified Senseis under Technical Director Stéphane Bérubé – built on discipline, respect, and a genuine love of the sport.',
    figure: '2012', figureLabel: 'founded in Dieppe',
    figure2: '200+', figureLabel2: 'judoka in our community',
  },
  schedule: {
    eyebrow: 'About Otoshi',
    title: 'Class schedule – Dieppe',
    jumpCta: 'Find Class Times',
    address: '1571 Melanson Rd, Dieppe, NB',
    closedLabel: 'Closed',
    // Malcolm's fix: day-by-day, from the club's own 2026-2027 activities
    // calendar he sent as reference - not the old "Mon-Fri" summary rows,
    // which he flagged as hard to follow.
    days: [
      { day: 'Sunday', classes: [] },
      { day: 'Monday', classes: [
        { time: '7:00 – 8:00 am', name: 'Conditioning' },
        { time: '3:00 – 4:30 pm', name: 'Student-Athlete Program' },
        { time: '5:00 – 6:15 pm', name: 'Intermediates A' },
        { time: '6:15 – 7:30 pm', name: 'Intermediates B' },
        { time: '7:30 – 9:00 pm', name: 'Adults/Teens' },
      ] },
      { day: 'Tuesday', classes: [
        { time: '5:00 – 6:00 pm', name: 'Beginners A' },
        { time: '6:00 – 7:00 pm', name: 'Beginners B' },
        { time: '7:00 – 9:00 pm', name: 'Elites' },
      ] },
      { day: 'Wednesday', classes: [
        { time: '7:00 – 8:00 am', name: 'Intro to Conditioning' },
        { time: '3:00 – 4:30 pm', name: 'Student-Athlete Program' },
        { time: '5:00 – 6:15 pm', name: 'Intermediates A' },
        { time: '6:15 – 7:30 pm', name: 'Intermediates B' },
        { time: '7:30 – 9:00 pm', name: 'Adults/Teens' },
      ] },
      { day: 'Thursday', classes: [
        { time: '5:00 – 6:00 pm', name: 'Beginners A' },
        { time: '6:00 – 7:00 pm', name: 'Beginners B' },
        { time: '7:00 – 9:00 pm', name: 'Elites' },
      ] },
      { day: 'Friday', classes: [
        { time: '7:00 – 8:00 am', name: 'Conditioning' },
        { time: '5:00 – 6:15 pm', name: 'Intermediates A' },
        { time: '6:15 – 7:30 pm', name: 'Intermediates B' },
        { time: '7:30 – 9:00 pm', name: 'Elites' },
      ] },
      { day: 'Saturday', classes: [
        { time: '9:00 – 9:45 am', name: 'Ninja' },
        { time: '10:00 am – 12:00 pm', name: 'Advanced' },
      ] },
    ],
    notes: [
      'There is no break between classes - please exit the mats as soon as your class ends.',
      'The dojo operates on a regular basis for most holidays. Follow us on Facebook and Instagram for closure announcements.',
    ],
  },
  judoForAll: {
    eyebrow: 'Judo For All',
    title: 'A path in for newcomers of any age.',
    body: 'A program designed to welcome newcomers of all ages and abilities into judo, in a supportive, structured, and fun environment.',
    benefits: ['Confidence and self-discipline', 'Cultural connection', 'Community and belonging', 'Stress relief and mental well-being', 'Respect and teamwork'],
    cta: 'Register Now',
  },
  sponsors: { label: 'Thank you to our sponsors' },
  cta: {
    eyebrow: 'Ready to start?',
    title: 'Step onto the mat.',
    sub: 'Free trial class, no obligation. Come see what a few years on the mat can build.',
    button: 'Join Club Otoshi',
    or: 'or call',
  },
  contact: {
    eyebrow: 'Contact Us',
    dojoLabel: 'Dojo',
    hoursLabel: 'Hours',
    hours: 'Monday – Friday: 5:00–6:00pm, 7:30–9:00pm',
    hours2: 'Saturday: 9:00am – 12:00pm',
    directions: 'Get Directions',
    followLabel: 'Follow along',
  },
  footer: {
    affiliation: 'Proudly supported by',
    bonaFideNote: 'logo to be confirmed',
    rights: 'Judo Otoshi. All rights reserved.',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
  },
  register: {
    pageTitle: 'Register',
    backToSite: 'Back to site',
    steps: ['Parent / Guardian', 'Emergency Contact', 'Registration', 'Agreements'],
    step1: {
      title: 'Parent / Guardian Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      emailHint: 'Used to send registration details and updates from the Otoshi team.',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal Code',
    },
    step2: {
      title: 'Emergency Contact Information',
      name: 'Emergency Contact Name',
      relationship: 'Relationship with Participant',
      phone: 'Emergency Contact Phone',
    },
    step3: {
      title: 'Registration',
      kids: 'Number of kids',
      adults: 'Number of adults',
      participant: 'Participant',
      kidLabel: 'Kid',
      adultLabel: 'Adult',
      class: 'Class',
      chooseClass: 'Choose a class…',
      chooseClassFirst: 'Choose a class first…',
      schedulePrice: 'Schedule & Price',
      parentDiscount: 'I already have a child registered at the club (50% off this registration)',
      firstName: 'First Name',
      lastName: 'Last Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      notes: 'Illnesses / Allergies / Injuries',
      notesHint: 'Optional',
      atLeastOneClass: 'Select at least one class to continue.',
      subtotal: 'Subtotal',
      parentDiscountLine: 'Parent discount (50%)',
      fee: 'Square processing fee',
      total: 'Total',
      pricingNote: 'Monthly tuition. The club will follow up separately to arrange payment through Square.',
    },
    step4: {
      title: 'Required Agreements',
      judoNbTitle: 'Awareness and Assumption of Risk, Release of Liability, Waiver of Claims and Indemnity Agreement',
      judoNbBody: [
        'AWARENESS AND ASSUMPTION OF RISK',
        'I am aware that Judo involves risks including risk of personal injury, death, property damage, expense and related loss, including loss of income. Included in these risks are negligence on the part of Judo NB, its directors, officers, staff, officials, member clubs, volunteers, Judo Canada, other participants and owners of the facilities where activities occur. I freely accept and fully assume all such risks and the possibility of personal injury, death, property damage, expense and related loss, including loss of income.',
        'RELEASE OF LIABILITY, WAIVER OF CLAIMS AND INDEMNITY AGREEMENT',
        'In consideration of Judo NB accepting my application to participate in Judo activities, I agree:',
        '1. To waive any and all claims that may I have in the future against Judo NB, its directors, officers, staff, officials, member clubs, volunteers, Judo Canada, other participants and owners of the facilities where activities occur.',
        '2. To release Judo NB, its directors, officers, staff, officials, member clubs, volunteers, Judo Canada, other participants and owners of the facilities where activities occur from any and all liability for any personal injury, death, property damage, expense and related loss, including loss of income that I or my next of kin may suffer as a result of my participation in this activity, due to any cause whatsoever, including negligence, breach of contract or breach of any statutory duty of care.',
        '3. To hold harmless and indemnify Judo NB, its directors, officers, staff, officials, member clubs, volunteers, Judo Canada, other participants and owners of the facilities where activities occur from any and all liability for any damage to property of, or personal injury to, any third party, resulting from my participation in this activity.',
        '4. To allow the use of my name, photographic image, and relevant personal information for the promotion of judo in the media, judo related publications & websites, and for use by governing judo associations, when deemed appropriate by Judo NB.',
      ],
      clubTitle: 'Club Otoshi Waiver',
      clubBody: [
        'I understand and agree that in participating in any Judo class, workshop, rehearsal or performance, there is a possibility of physical injury or death. I voluntarily agree, therefore, to assume all risks and responsibility for any such injury or accident, which might occur to me or my child during any of OTOSHI’s classes, rehearsals, performances, or activities. I also exempt, release, and indemnify OTOSHI, its owners, agents, volunteers, assistants, employees, faculty members, and/or students from any and all liability claims, demands, or causes of action whatsoever from any damage, loss, injury, or death to me, my children, or property which may arise out of or in connection with participation in any classes or activities conducted by OTOSHI. I further hereby voluntarily agree to waive my rights and that of my heirs and assigns to hold OTOSHI, its owners, agents, volunteers, assistants, employees, faculty members, and/or students liable for such damage, loss, injury, or death. I understand that I should be aware of my physical limitations and agree not to exceed them. If I am signing this waiver for my children, I certify that I am the parent or legal guardian and have the right to waive these rights. Permission is granted to OTOSHI to use photographs of members for publicity purposes.',
      ],
      agree: 'I have read and agree to the above',
      mustAgree: 'Both waivers must be checked to submit your registration.',
    },
    stepNav: { next: 'Next', back: 'Back', submit: 'Submit Registration', submitting: 'Sending…' },
    required: 'This field is required.',
    invalidEmail: 'Enter a valid email address.',
    invalidPhone: 'Enter a valid phone number.',
    success: {
      title: 'Registration received!',
      body: 'We’ve sent your registration to the Otoshi team - they’ll be in touch shortly.',
      paymentNote: 'Payment isn’t collected here yet. The club will follow up separately about paying through Square.',
      backHome: 'Back to home',
    },
    error: {
      title: 'Something went wrong',
      body: 'We couldn’t send your registration. Please try again, or contact the club directly.',
    },
  },
};

export type Copy = typeof EN;

export const FR: Copy = {
  code: 'FR',
  langName: 'Français',
  nav: { home: 'Accueil', about: 'À propos d’Otoshi', schedule: 'Horaire', contact: 'Contactez-nous', cta: 'Joindre le Club Otoshi' },
  hero: {
    eyebrow: 'Art martial · Grand Moncton',
    title: 'Judo Otoshi',
    sub: 'Une confiance inébranlable et une concentration à toute épreuve, une ceinture à la fois.',
    cta: 'Joindre le Club Otoshi',
    alt: 'Voir nos programmes',
    locationLabel: 'Emplacement du club',
    location: '1571, chemin Melanson, Dieppe',
    phoneLabel: 'Appeler le dojo',
  },
  community: {
    items: [
      {
        title: 'Un dojo, des racines profondes',
        body: 'À Dieppe depuis 2012 : la même équipe d’entraîneurs, la même communauté, en croissance chaque année dans le Grand Moncton.',
      },
      {
        title: 'Instructeurs de judo certifiés',
        body: 'Entraînez-vous avec des Senseis expérimentés et certifiés, dévoués à la sécurité, au développement du caractère et à un enseignement technique éprouvé.',
      },
      {
        title: 'Priorité à la famille',
        body: 'Nous encourageons l’entraînement en famille grâce à des rabais importants pour les inscriptions multiples et des cours adaptés à chaque âge.',
      },
    ],
  },
  programs: {
    eyebrow: 'Cours de judo',
    title: 'Un cours pour chaque âge et chaque niveau.',
    items: [
      {
        key: 'beginner', img: 'Beginner.jpg', name: 'Débutant', ages: 'De 6 à 13 ans',
        body: 'Nouveau au judo. Bien tomber, l’équilibre et les premières projections, dans un cours structuré et encourageant.',
        long: [
          'Débutant est le point de départ de chaque jeune judoka : des cours bâtis autour des bases qui rendent l’entraînement sécuritaire et amusant dès le premier jour, soit bien tomber sans crainte, l’équilibre, la prise et les premières projections.',
          'Les cours sont divisés en deux groupes (Débutants A et B) afin que les instructeurs puissent suivre de près la technique à cette étape, avec un accent sur la discipline, le respect et la confiance que procure la réussite d’une nouvelle habileté pour la première fois.',
        ],
        classNames: ['Débutants A', 'Débutants B'],
      },
      {
        key: 'intermediate', img: 'Intermediates-regular.jpg', name: 'Intermédiaire', ages: 'De 8 à 13 ans',
        body: 'Quelques années d’expérience. On développe la technique et le sens du combat vers la prochaine ceinture.',
        long: [
          'Intermédiaire s’appuie sur les bases de Débutant avec un vocabulaire technique plus large : projections, travail au sol (newaza) et sens tactique qui transforme des mouvements isolés en un vrai combat de judo.',
          'Les élèves s’entraînent en deux groupes (Intermédiaires A et B), avec une troisième séance hebdomadaire optionnelle et un ajout de conditionnement pour les judokas qui se préparent pour leur prochaine ceinture ou leurs premiers tournois.',
        ],
        classNames: ['Intermédiaires A', 'Intermédiaires B'],
      },
      {
        key: 'elite', img: 'Elites.jpg', name: 'Élite', ages: '13 ans et plus',
        body: 'Le programme compétitif, pour les judokas qui s’entraînent vers les tournois et les standards provinciaux.',
        long: [
          'Élite est le programme compétitif du club, pour les judokas qui s’entraînent vers les tournois et les standards provinciaux. Travail technique, randori en direct et stratégie développent la condition physique et le sens du combat qu’exige la compétition.',
          'Des séances de conditionnement optionnelles (une ou deux de plus par semaine) sont offertes aux athlètes qui se préparent pour un horaire de compétition plus chargé.',
        ],
        classNames: ['Élites'],
      },
      {
        key: 'adult', img: 'Adults.jpg', name: 'Adulte', ages: '14 ans et plus',
        body: 'Tous les niveaux sont bienvenus. Force, discipline et défense personnelle réelle, selon votre horaire.',
        long: [
          'Adulte accueille tous les niveaux, du débutant qui monte sur le tatami pour la première fois à celui qui revient au sport après plusieurs années d’absence. Les cours couvrent la vraie défense personnelle, les projections et le travail au sol du judo, ainsi qu’un entraînement sérieux, selon votre propre rythme.',
          'Les parents qui ont déjà un enfant inscrit au club obtiennent 50 % de rabais sur leur propre inscription Adulte.',
        ],
        classNames: ['Adultes/Ados'],
      },
    ],
    trial: { title: 'Vous débutez?', body: 'Montez sur le tatami avec un cours d’essai gratuit et découvrez Judo Otoshi.', cta: 'Montez sur le tatami' },
    detail: {
      backToPrograms: 'Retour aux cours',
      whenItMeets: 'Horaire de ce cours',
      whatToExpect: 'À quoi s’attendre',
      cta: 'S’inscrire à ce cours',
      notFoundTitle: 'Cours introuvable',
      notFoundBody: 'Nous n’avons pas trouvé ce cours. Consultez plutôt la liste complète.',
    },
  },
  who: {
    eyebrow: 'Qui nous sommes',
    title: 'La signification du nom.',
    body: 'En judo, « otoshi » (落とし) signifie « chute » ou « tombée » – une composante de plusieurs techniques de projection, dont le Tai Otoshi (chute du corps) et le Tani Otoshi (chute de la vallée), classées parmi les Sutemi Waza, les techniques de sacrifice.',
    body2: 'Fondé à Dieppe en 2012, Otoshi est devenu une communauté de plus de 200 judokas, encadrée par huit Senseis certifiés sous la direction technique de Stéphane Bérubé – bâtie sur la discipline, le respect et un amour sincère du sport.',
    figure: '2012', figureLabel: 'fondé à Dieppe',
    figure2: '200+', figureLabel2: 'judokas dans notre communauté',
  },
  schedule: {
    eyebrow: 'À propos d’Otoshi',
    title: 'Horaire des cours – Dieppe',
    jumpCta: 'Trouver l’horaire',
    address: '1571, chemin Melanson, Dieppe (N.-B.)',
    closedLabel: 'Fermé',
    days: [
      { day: 'Dimanche', classes: [] },
      { day: 'Lundi', classes: [
        { time: '7 h – 8 h', name: 'Conditionnement' },
        { time: '15 h – 16 h 30', name: 'Programme étudiant-athlète' },
        { time: '17 h – 18 h 15', name: 'Intermédiaires A' },
        { time: '18 h 15 – 19 h 30', name: 'Intermédiaires B' },
        { time: '19 h 30 – 21 h', name: 'Adultes/Ados' },
      ] },
      { day: 'Mardi', classes: [
        { time: '17 h – 18 h', name: 'Débutants A' },
        { time: '18 h – 19 h', name: 'Débutants B' },
        { time: '19 h – 21 h', name: 'Élites' },
      ] },
      { day: 'Mercredi', classes: [
        { time: '7 h – 8 h', name: 'Introduction au conditionnement' },
        { time: '15 h – 16 h 30', name: 'Programme étudiant-athlète' },
        { time: '17 h – 18 h 15', name: 'Intermédiaires A' },
        { time: '18 h 15 – 19 h 30', name: 'Intermédiaires B' },
        { time: '19 h 30 – 21 h', name: 'Adultes/Ados' },
      ] },
      { day: 'Jeudi', classes: [
        { time: '17 h – 18 h', name: 'Débutants A' },
        { time: '18 h – 19 h', name: 'Débutants B' },
        { time: '19 h – 21 h', name: 'Élites' },
      ] },
      { day: 'Vendredi', classes: [
        { time: '7 h – 8 h', name: 'Conditionnement' },
        { time: '17 h – 18 h 15', name: 'Intermédiaires A' },
        { time: '18 h 15 – 19 h 30', name: 'Intermédiaires B' },
        { time: '19 h 30 – 21 h', name: 'Élites' },
      ] },
      { day: 'Samedi', classes: [
        { time: '9 h – 9 h 45', name: 'Ninja' },
        { time: '10 h – 12 h', name: 'Avancé' },
      ] },
    ],
    notes: [
      'Il n’y a pas de pause entre les cours - veuillez quitter le tatami dès la fin de votre cours.',
      'Le dojo est ouvert de façon régulière pendant la plupart des congés. Suivez-nous sur Facebook et Instagram pour les annonces de fermeture.',
    ],
  },
  judoForAll: {
    eyebrow: 'Judo pour tous',
    title: 'Une porte d’entrée pour les nouveaux venus, à tout âge.',
    body: 'Un programme conçu pour accueillir les nouveaux venus de tout âge et de tout niveau dans le judo, dans un environnement structuré, encourageant et amusant.',
    benefits: ['Confiance et autodiscipline', 'Connexion culturelle', 'Communauté et appartenance', 'Gestion du stress et bien-être mental', 'Respect et esprit d’équipe'],
    cta: 'S’inscrire maintenant',
  },
  sponsors: { label: 'Merci à nos commanditaires' },
  cta: {
    eyebrow: 'Prêt à commencer?',
    title: 'Montez sur le tatami.',
    sub: 'Cours d’essai gratuit, sans obligation. Venez voir ce que quelques années sur le tatami peuvent bâtir.',
    button: 'Joindre le Club Otoshi',
    or: 'ou appelez le',
  },
  contact: {
    eyebrow: 'Contactez-nous',
    dojoLabel: 'Dojo',
    hoursLabel: 'Heures',
    hours: 'Lundi – vendredi : 17 h – 18 h, 19 h 30 – 21 h',
    hours2: 'Samedi : 9 h – 12 h',
    directions: 'Obtenir l’itinéraire',
    followLabel: 'Suivez-nous',
  },
  footer: {
    affiliation: 'Fièrement soutenu par',
    bonaFideNote: 'logo à confirmer',
    rights: 'Judo Otoshi. Tous droits réservés.',
    terms: 'Conditions d’utilisation',
    privacy: 'Politique de confidentialité',
  },
  register: {
    pageTitle: 'Inscription',
    backToSite: 'Retour au site',
    steps: ['Parent / tuteur', 'Contact d’urgence', 'Inscription', 'Ententes'],
    step1: {
      title: 'Renseignements du parent / tuteur',
      firstName: 'Prénom',
      lastName: 'Nom de famille',
      email: 'Courriel',
      emailHint: 'Utilisé pour envoyer les détails d’inscription et les mises à jour de l’équipe Otoshi.',
      phone: 'Téléphone',
      address: 'Adresse',
      city: 'Ville',
      province: 'Province',
      postalCode: 'Code postal',
    },
    step2: {
      title: 'Renseignements du contact d’urgence',
      name: 'Nom du contact d’urgence',
      relationship: 'Lien avec le participant',
      phone: 'Téléphone du contact d’urgence',
    },
    step3: {
      title: 'Inscription',
      kids: 'Nombre d’enfants',
      adults: 'Nombre d’adultes',
      participant: 'Participant',
      kidLabel: 'Enfant',
      adultLabel: 'Adulte',
      class: 'Cours',
      chooseClass: 'Choisir un cours…',
      chooseClassFirst: 'Choisir un cours d’abord…',
      schedulePrice: 'Horaire et prix',
      parentDiscount: 'J’ai déjà un enfant inscrit au club (50 % de rabais sur cette inscription)',
      firstName: 'Prénom',
      lastName: 'Nom de famille',
      dob: 'Date de naissance',
      gender: 'Sexe',
      male: 'Masculin',
      female: 'Féminin',
      notes: 'Maladies / Allergies / Blessures',
      notesHint: 'Optionnel',
      atLeastOneClass: 'Sélectionnez au moins un cours pour continuer.',
      subtotal: 'Sous-total',
      parentDiscountLine: 'Rabais parent (50 %)',
      fee: 'Frais de traitement Square',
      total: 'Total',
      pricingNote: 'Frais mensuels. Le club communiquera séparément pour organiser le paiement via Square.',
    },
    step4: {
      title: 'Ententes requises',
      // French rendering of the same waiver language as the EN version
      // (itself verbatim from the club's previous registration form) - a
      // careful, complete translation, not a paraphrase, since this is
      // binding legal text. Recommend having Judo NB / the club's own
      // French-speaking reviewer confirm the wording before this goes live,
      // the same way Malcolm confirmed the pricing data.
      judoNbTitle: 'Connaissance et acceptation des risques, décharge de responsabilité, renonciation aux réclamations et entente d’indemnisation',
      judoNbBody: [
        'CONNAISSANCE ET ACCEPTATION DES RISQUES',
        'Je suis conscient(e) que le judo comporte des risques, notamment des risques de blessure corporelle, de décès, de dommages matériels, de dépenses et de pertes connexes, y compris une perte de revenu. Ces risques comprennent la négligence de la part de Judo NB, de ses administrateurs, dirigeants, employés, officiels, clubs membres, bénévoles, de Judo Canada, des autres participants et des propriétaires des installations où se déroulent les activités. J’accepte librement et j’assume pleinement tous ces risques ainsi que la possibilité de blessure corporelle, de décès, de dommages matériels, de dépenses et de pertes connexes, y compris une perte de revenu.',
        'DÉCHARGE DE RESPONSABILITÉ, RENONCIATION AUX RÉCLAMATIONS ET ENTENTE D’INDEMNISATION',
        'En contrepartie de l’acceptation par Judo NB de ma demande de participation aux activités de judo, je consens à ce qui suit :',
        '1. Renoncer à toute réclamation que je pourrais avoir dans le futur contre Judo NB, ses administrateurs, dirigeants, employés, officiels, clubs membres, bénévoles, Judo Canada, les autres participants et les propriétaires des installations où se déroulent les activités.',
        '2. Décharger Judo NB, ses administrateurs, dirigeants, employés, officiels, clubs membres, bénévoles, Judo Canada, les autres participants et les propriétaires des installations où se déroulent les activités de toute responsabilité pour toute blessure corporelle, tout décès, tout dommage matériel, toute dépense et toute perte connexe, y compris une perte de revenu, que moi-même ou mes proches pourrions subir en raison de ma participation à cette activité, peu importe la cause, y compris la négligence, le manquement à un contrat ou le manquement à une obligation légale de diligence.',
        '3. Tenir indemnes Judo NB, ses administrateurs, dirigeants, employés, officiels, clubs membres, bénévoles, Judo Canada, les autres participants et les propriétaires des installations où se déroulent les activités de toute responsabilité pour tout dommage matériel ou toute blessure corporelle subis par un tiers et résultant de ma participation à cette activité.',
        '4. Permettre l’utilisation de mon nom, de mon image photographique et des renseignements personnels pertinents aux fins de la promotion du judo dans les médias, les publications et sites Web liés au judo, ainsi que par les associations de judo compétentes, lorsque Judo NB le juge approprié.',
      ],
      clubTitle: 'Décharge du Club Otoshi',
      clubBody: [
        'Je comprends et j’accepte qu’en participant à tout cours, atelier, répétition ou représentation de judo, il existe une possibilité de blessure corporelle ou de décès. J’accepte donc volontairement d’assumer tous les risques et toute la responsabilité pour toute blessure ou tout accident pouvant survenir à moi-même ou à mon enfant durant les cours, répétitions, représentations ou activités d’OTOSHI. J’exempte, décharge et tiens également indemnes OTOSHI, ses propriétaires, agents, bénévoles, assistants, employés, membres du corps enseignant et/ou étudiants de toute réclamation de responsabilité, demande ou cause d’action, quelle qu’elle soit, découlant de tout dommage, perte, blessure ou décès me touchant, touchant mes enfants ou touchant des biens, pouvant résulter de la participation à des cours ou activités organisés par OTOSHI ou y étant liés. Je consens en outre volontairement à renoncer à mes droits et à ceux de mes héritiers et ayants droit de tenir OTOSHI, ses propriétaires, agents, bénévoles, assistants, employés, membres du corps enseignant et/ou étudiants responsables d’un tel dommage, d’une telle perte, blessure ou d’un tel décès. Je comprends que je dois être conscient(e) de mes limites physiques et je m’engage à ne pas les dépasser. Si je signe cette décharge au nom de mes enfants, je certifie être le parent ou le tuteur ou la tutrice légal(e) et avoir le droit de renoncer à ces droits en leur nom. La permission est accordée à OTOSHI d’utiliser des photographies des membres à des fins publicitaires.',
      ],
      agree: 'J’ai lu et j’accepte ce qui précède',
      mustAgree: 'Les deux décharges doivent être cochées pour soumettre votre inscription.',
    },
    stepNav: { next: 'Suivant', back: 'Retour', submit: 'Soumettre l’inscription', submitting: 'Envoi en cours…' },
    required: 'Ce champ est requis.',
    invalidEmail: 'Entrez une adresse courriel valide.',
    invalidPhone: 'Entrez un numéro de téléphone valide.',
    success: {
      title: 'Inscription reçue!',
      body: 'Nous avons envoyé votre inscription à l’équipe d’Otoshi - elle communiquera avec vous sous peu.',
      paymentNote: 'Le paiement n’est pas encore collecté ici. Le club vous contactera séparément au sujet du paiement par Square.',
      backHome: 'Retour à l’accueil',
    },
    error: {
      title: 'Une erreur s’est produite',
      body: 'Nous n’avons pas pu envoyer votre inscription. Veuillez réessayer ou contacter le club directement.',
    },
  },
};

export type Lang = 'en' | 'fr';
export const COPY: Record<Lang, Copy> = { en: EN, fr: FR };
