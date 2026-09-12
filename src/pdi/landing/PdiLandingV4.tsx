import React from "react";
import PdiIllustratorHome from "../home/PdiIllustratorHome";

export type PdiLandingV4Props = {
  /** Appelé pour entrer dans le logiciel (connexion / démarrage). */
  onEnter: (target?: string) => void;
  onOpenAuth?: (tab?: "login" | "register" | "activation") => void;
  initialScreen?: "landing" | "home" | "launcher";
};

export default function PdiLandingV4({ onEnter, onOpenAuth }: PdiLandingV4Props) {
  const handleNewProject = () => {
    if (onOpenAuth) {
      onOpenAuth("login");
    } else {
      onEnter("isometric");
    }
  };

  const handleOpenProject = () => {
    onEnter("projects");
  };

  const handleOpenModule = (moduleName: string) => {
    onEnter(moduleName);
  };

  return (
    <PdiIllustratorHome
      onNewProject={handleNewProject}
      onOpenProject={handleOpenProject}
      onOpenModule={handleOpenModule}
    />
  );
}
