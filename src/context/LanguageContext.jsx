import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

export const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    costumes: 'Costumes',
    customers: 'Clients',
    rentals: 'Locations',
    blacklist: 'Liste Noire',
    reminders: 'Rappels',
    signOut: 'Déconnexion',
    // Dashboard
    dashboardTitle: 'Tableau de Bord',
    dashboardSubtitle: 'Aperçu de votre activité de location',
    totalCostumes: 'Total Costumes',
    available: 'Disponible',
    totalCustomers: 'Total Clients',
    activeRentals: 'Locations Actives',
    welcome: 'Bienvenue!',
    welcomeMessage: 'Ce système de gestion de location de costumes vous aide à gérer efficacement votre inventaire, vos clients et vos locations.',
    // Costumes
    costumesTitle: 'Costumes',
    costumesSubtitle: 'Gérer votre inventaire de costumes',
    addCostume: 'Ajouter Costume',
    editCostume: 'Modifier Costume',
    deleteCostume: 'Supprimer Costume',
    costumeId: 'ID Costume',
    name: 'Nom',
    size: 'Taille',
    rentalPrice: 'Prix Location (DH)',
    totalQuantity: 'Quantité Totale',
    availableQuantity: 'Quantité Disponible',
    imageUrl: 'URL Image (Optionnel)',
    uploadImage: 'Ou Télécharger Image',
    stock: 'Stock',
    outOfStock: 'Épuisé',
    searchCostumes: 'Rechercher costumes...',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    // Customers
    customersTitle: 'Clients',
    customersSubtitle: 'Gérer les informations clients',
    addCustomer: 'Ajouter Client',
    editCustomer: 'Modifier Client',
    deleteCustomer: 'Supprimer Client',
    nationalId: 'Carte Nationale',
    dateOfBirth: 'Date de Naissance',
    phoneNumber: 'Téléphone',
    cinRecto: 'CIN Recto',
    cinVerso: 'CIN Verso',
    voiceNote: 'Note Vocale',
    otherDocuments: 'Autres Documents',
    searchCustomers: 'Rechercher clients...',
    history: 'Historique',
    rent: 'Louer',
    // Rentals
    rentalsTitle: 'Gestion des Locations',
    rentalsSubtitle: 'Suivre et gérer toutes les locations',
    searchRentals: 'Rechercher locations...',
    allRentals: 'Toutes Locations',
    active: 'Active',
    overdue: 'En Retard',
    returned: 'Retourné',
    customer: 'Client',
    rentalPeriod: 'Période Location',
    returnDate: 'Date Retour',
    processReturn: 'Traiter Retour',
    noRentalsFound: 'Aucune location trouvée',
    // Blacklist
    blacklistTitle: 'Liste Noire',
    blacklistSubtitle: 'Gérer les clients interdits',
    addToBlacklist: 'Ajouter à Liste Noire',
    removeFromBlacklist: 'Retirer',
    reason: 'Raison',
    addedBy: 'Ajouté Par',
    date: 'Date',
    searchBlacklist: 'Rechercher liste noire...',
    // Reminders
    remindersTitle: 'Rappels',
    remindersSubtitle: 'Gérer les rappels de retour',
    createReminder: 'Créer Rappel',
    selectRental: 'Sélectionner Location',
    reminderDate: 'Date Rappel',
    message: 'Message',
    status: 'Statut',
    sent: 'Envoyé',
    pending: 'En Attente',
    markSent: 'Marquer Envoyé',
    searchReminders: 'Rechercher rappels...',
    // Login
    loginTitle: 'NAIR CLASSE',
    loginSubtitle: 'Système de Gestion',
    emailAddress: 'Adresse Email',
    password: 'Mot de Passe',
    signIn: 'Connexion',
    signingIn: 'Connexion en cours...',
    // Common
    actions: 'Actions',
    costume: 'Costume',
    close: 'Fermer',
    save: 'Enregistrer',
    loading: 'Chargement...',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    costumes: 'Costumes',
    customers: 'Customers',
    rentals: 'Rentals',
    blacklist: 'Blacklist',
    reminders: 'Reminders',
    signOut: 'Sign Out',
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Overview of your costume rental business',
    totalCostumes: 'Total Costumes',
    available: 'Available',
    totalCustomers: 'Total Customers',
    activeRentals: 'Active Rentals',
    welcome: 'Welcome!',
    welcomeMessage: 'This costume rental management system helps you manage your inventory, customers, and rentals efficiently.',
    // Costumes
    costumesTitle: 'Costumes',
    costumesSubtitle: 'Manage your costume inventory',
    addCostume: 'Add Costume',
    editCostume: 'Edit Costume',
    deleteCostume: 'Delete Costume',
    costumeId: 'Costume ID',
    name: 'Name',
    size: 'Size',
    rentalPrice: 'Rental Price (DH)',
    totalQuantity: 'Total Quantity',
    availableQuantity: 'Available Quantity',
    imageUrl: 'Image URL (Optional)',
    uploadImage: 'Or Upload Image',
    stock: 'Stock',
    outOfStock: 'Out of Stock',
    searchCostumes: 'Search costumes...',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    // Customers
    customersTitle: 'Customers',
    customersSubtitle: 'Manage customer information',
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    deleteCustomer: 'Delete Customer',
    nationalId: 'National ID',
    dateOfBirth: 'Date of Birth',
    phoneNumber: 'Phone Number',
    cinRecto: 'ID Card Front',
    cinVerso: 'ID Card Back',
    voiceNote: 'Voice Note',
    otherDocuments: 'Other Documents',
    searchCustomers: 'Search customers...',
    history: 'History',
    rent: 'Rent',
    // Rentals
    rentalsTitle: 'Rental Management',
    rentalsSubtitle: 'Track and manage all costume rentals',
    searchRentals: 'Search rentals...',
    allRentals: 'All Rentals',
    active: 'Active',
    overdue: 'Overdue',
    returned: 'Returned',
    customer: 'Customer',
    rentalPeriod: 'Rental Period',
    returnDate: 'Return Date',
    processReturn: 'Process Return',
    noRentalsFound: 'No rentals found',
    // Blacklist
    blacklistTitle: 'Blacklist',
    blacklistSubtitle: 'Manage prohibited customers',
    addToBlacklist: 'Add to Blacklist',
    removeFromBlacklist: 'Remove',
    reason: 'Reason',
    addedBy: 'Added By',
    date: 'Date',
    searchBlacklist: 'Search blacklist...',
    // Reminders
    remindersTitle: 'Reminders',
    remindersSubtitle: 'Manage rental return reminders',
    createReminder: 'Create Reminder',
    selectRental: 'Select Rental',
    reminderDate: 'Reminder Date',
    message: 'Message',
    status: 'Status',
    sent: 'Sent',
    pending: 'Pending',
    markSent: 'Mark Sent',
    searchReminders: 'Search reminders...',
    // Login
    loginTitle: 'NAIR CLASSE',
    loginSubtitle: 'Management System',
    emailAddress: 'Email Address',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    // Common
    actions: 'Actions',
    costume: 'Costume',
    close: 'Close',
    save: 'Save',
    loading: 'Loading...',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('fr');

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}