
export interface VideoFrame {
  timestamp: string;
  visual: string;
  speech: string;
  textOverlay: string;
}

export interface LeadMagnet {
  title: string;
  description: string;
  points: string[];
  ctaTrigger: string;
}

export interface ContentEmpireOutput {
  videoDirectorPlan: {
    hook: string;
    timeline: VideoFrame[];
    finalCta: string;
  };
  instagramPost: {
    caption: string;
    hashtags: string[];
  };
  linkedInArticle: {
    title: string;
    content: string;
  };
  leadMagnet: LeadMagnet;
  storyIdeas: string[];
}

export enum AppTab {
  FACTORY = 'factory',
  DIRECTORS = 'directors',
}

export interface TranscriptionResult {
  text: string;
}

export interface DirectorAdvice {
  name: string;
  role: string;
  advice: string;
  quote: string;
}

export interface BoardOfDirectorsOutput {
  jobs: DirectorAdvice;
  buffett: DirectorAdvice;
  cardone: DirectorAdvice;
  tzu: DirectorAdvice;
}
