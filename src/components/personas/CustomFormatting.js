/**
 * Helper function to check and fix Succubus persona format settings
 */
export const checkAndFixSuccubusFormatting = (persona) => {
  // Check if this is the Succubus persona
  if (persona?.name === 'Succubus') {
    console.log('Current Succubus format settings:', persona.formatSettings);
    
    // Make sure format settings are correctly configured
    if (persona.formatSettings?.customFormatting === true) {
      console.log('Fixing Succubus format settings - disabling custom formatting');
      // Clone the persona to avoid mutating the original
      const fixedPersona = {...persona};
      fixedPersona.formatSettings = {
        useRoleplayMarkdown: true,
        customFormatting: false
      };
      return fixedPersona;
    }
  }
  
  return persona;
};

/**
 * Creates the proper format rules for roleplay markdown
 */
export const createRoleplayFormatRules = () => {
  return [
    {
      name: "Speech with attributes",
      enabled: true,
      startTag: '<speech as="',
      endTag: '</speech>',
      markdownFormat: '**{{character}}:** {{content}}'
    },
    {
      name: "Action with attributes",
      enabled: true,
      startTag: '<action as="',
      endTag: '</action>',
      markdownFormat: '*{{character}} {{content}}*'
    },
    {
      name: "Function",
      enabled: true,
      startTag: '<function>',
      endTag: '</function>',
      markdownFormat: '```\n{{content}}\n```'
    }
  ];
};