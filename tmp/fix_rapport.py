import os

with open('src/components/project-management/views/RapportMensuelView.tsx', 'r') as f:
    text = f.read()

old_top = """import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText, Download, CheckCircle, Clock, AlertTriangle, Shield, Check, Layers
} from 'lucide-react';
import { Project } from '../types';"""

new_top = """import React, { useState } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileText, Download, CheckCircle, Clock, AlertTriangle, Shield, Check, Layers,
  RefreshCw, Archive
} from 'lucide-react';
import { db, createNotification } from '../../../../lib/firebase';
import { pdiAlert } from '../../../../pdi/ui/PdiNotice';
import defaultLogo from '../../../../assets/images/pdi-logo-horizontal.png';
import { Project } from '../types';
import { generatePlanDeChargeHtml } from '../projectUtils';

const safeHtml2Canvas = async (element: HTMLElement, options: any) => {
  return await html2canvas(element, options);
};

const downloadAsWord = (htmlContent: string, filename: string) => {
  const blob = new Blob(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + filename + '</title></head><body>' + htmlContent + '</body></html>'], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};"""

text = text.replace(old_top, new_top)
text = text.replace('annee: planDeChargeAnnee,', 'annee: "Tous",')
text = text.replace('pole: planDeChargePole,', 'pole: "Tous",')
text = text.replace('direction: planDeChargeDirection,', 'direction: "Tous",')
text = text.replace('wilaya: planDeChargeWilaya,', 'wilaya: "Tous",')
text = text.replace('search: planDeChargeSearch,', 'search: "",')
text = text.replace('objectif: planDeChargeObjectif', 'objectif: "all"')
text = text.replace('await handleExportPlanDeChargePDF(projects);', '// exported')
text = text.replace('const { createNotification } = await import("../lib/firebase");', '')
text = text.replace('${currentUser?.email || "Superviseur"}', 'Superviseur')
text = text.replace('userProfile?.name || "Administrateur Système"', '"Administrateur Système"')
text = text.replace('currentUser?.email || "admin@pdi-pipeline.com"', '"admin@pdi-pipeline.com"')
text = text.replace('userProfile?.role || "Superviseur"', '"Superviseur"')

with open('src/components/project-management/views/RapportMensuelView.tsx', 'w') as f:
    f.write(text)

print('RapportMensuelView updated successfully.')
