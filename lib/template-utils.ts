export type TemplateVariables = {
  jobTitle: string;
};

export const TEMPLATE_PLACEHOLDER = '{{jobTitle}}';

export const applyTemplate = (text: string, vars: TemplateVariables): string => {
  return text.replace(/\{\{jobTitle\}\}/g, vars.jobTitle);
};

export const textToHtml = (text: string): string => {
  return text.replace(/\n/g, '<br>');
};
