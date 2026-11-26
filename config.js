// Central business settings. Change a price or contact detail here and it updates on every page.
module.exports = {
  name: "THE BUSINESS CLERK LLC",
  brand: "The Business Clerk",
  domain: "https://thebusinessclerk.com",
  email: "hello@thebusinessclerk.com",
  tagline: "Florida Registered Agent · Business Formation · Address & Mail · Launch",
  prices: {
    formation: 213,        // Florida LLC: $39 service + $125 state fee + $49 first-year registered agent
    formationCorp: 158,    // Florida corporation: $39 service + $70 state fee + $49 first-year registered agent
    formationService: 39,  // Our formation service fee (matches lowest competitors)
    ein: 75,               // EIN application add-on
    raAnnual: 49,          // Registered agent only, per year
    annualReport: 100,     // Annual report filing service (state fee separate)
    mailBasic: 20,         // Business address + mail scanning and forwarding, per month
    launch: 350,           // Launch Pack: name & trademark search, domain, email, website up to 5 pages
  },
  alaCarte: [
    ["EIN application", 75],
    ["Change of registered agent", "$0 with agent service"],
    ["Articles of Amendment", 85],
    ["Amended annual report", 65],
    ["Business address change", 65],
    ["DBA / fictitious name registration", 75],
    ["Certificate of Status request", 25],
    ["Certified copy request", 35],
    ["LLC dissolution", 95],
    ["Reinstatement", "from $175"],
    ["Foreign qualification in Florida", 39],
  ],
  stateFees: {
    llcArticles: "125.00", corpArticles: "70.00",
    llcAnnual: "138.75", corpAnnual: "150.00",
    llcAnnualLate: "538.75", corpAnnualLate: "550.00",
    llcRaChange: "25.00", corpRaChange: "35.00",
    llcReinstate: "100.00",
  },
};
