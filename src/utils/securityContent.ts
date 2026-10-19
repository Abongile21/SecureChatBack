export interface ContentPrompts {
  [key: string]: string;
}

export const securityPrompts: ContentPrompts = {
  phishingEducation: `Explain phishing in simple terms and provide 3 warning signs of a phishing email.`,
  passwordSecurity: `Provide 5 tips for creating a strong password that's both secure and memorable.`,
  malwareAwareness: `Describe common types of malware and how users can protect themselves.`,
  socialEngineering: `Explain social engineering attacks and defense strategies.`,
  twoFactorAuth: `Explain the benefits of two-factor authentication and when to use it.`,
  publicWiFi: `Provide safety guidelines for using public WiFi networks.`,
  dataProtection: `Explain best practices for protecting sensitive data.`,
  incidentResponse: `Describe steps to take if you suspect a security incident.`,
};

export const phishingScenarios = [
  {
    id: 'scenario_1',
    subject: 'Urgent: Verify Your Account Information',
    content: 'Click here to verify your account immediately or it will be disabled.',
    indicators: ['Urgency', 'Generic greeting', 'Suspicious link', 'Threats'],
  },
  {
    id: 'scenario_2',
    subject: 'Congratulations! You\'ve Won a Prize',
    content: 'You have been selected to receive $5,000. Click to claim your prize now.',
    indicators: ['Too good to be true', 'Unexpected reward', 'Click bait', 'Suspicious sender'],
  },
  {
    id: 'scenario_3',
    subject: 'IT Department: Update Your Password',
    content: 'Please update your password by clicking the link below.',
    indicators: ['Impersonation', 'Suspicious link', 'Unusual request', 'Poor formatting'],
  },
];

export const getRandomScenario = () => {
  const randomIndex = Math.floor(Math.random() * phishingScenarios.length);
  return phishingScenarios[randomIndex];
};
