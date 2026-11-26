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
    mailBasic: 25,         // Business address + mail log (envelope photo + alert), per month
    mailIncluded: 30,      // items logged per month included
    mailOverItem: '0.50',  // per item above that
    mailForward: '2.50',   // per forwarded item, plus postage at cost
    mailPackage: 3,        // per package received
    scanPages: 10,         // pages included per scan
    scanPage: '0.25',      // per extra page
    scanLevels: [['Pay as you go', 0, 0, '2.50'], ['Scan 10', 19, 10, '2.25'], ['Scan 25', 39, 25, '2.00'], ['Scan 50', 69, 50, '1.75'], ['Scan 100', 119, 100, '1.50']],
    bundle: 389,           // Annual bundle: registered agent + annual report filing + 12 months business address (state fee and mail usage extra)
    launch: 599,           // Launch Pack: name & trademark search, domain, email, website up to 5 pages
  },
  alaCarte: [
    ["EIN application", 75, "ein"],
    ["Change of registered agent", "$0 with agent service", "ra"],
    ["Articles of Amendment", 85, "amendment"],
    ["Amended annual report", 65, "amended_ar"],
    ["Business address change", 65, "address_change"],
    ["DBA / fictitious name registration", 75, "dba"],
    ["Certificate of Status request", 25, "cert_status"],
    ["Certified copy request", 35, "certified_copy"],
    ["Dissolution (LLC or corporation)", 95, "dissolution"],
    ["Reinstatement (state fees for all missed years at cost)", 175, "reinstatement"],
    ["Foreign qualification in Florida (includes first year of registered agent)", 88, "foreign"],
  ],
  stateFees: {
    llcArticles: "125.00", corpArticles: "70.00",
    llcAnnual: "138.75", corpAnnual: "150.00",
    llcAnnualLate: "538.75", corpAnnualLate: "550.00",
    llcRaChange: "25.00", corpRaChange: "35.00",
    llcReinstate: "100.00",
  },
};
