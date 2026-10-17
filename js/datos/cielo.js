// Estrellas hasta magnitud 4, líneas y nombres de las 88 constelaciones.
// Fuente: d3-celestial, de Olaf Frohn (datos del catálogo Hipparcos), simplificada y codificada.
//
// Copyright (c) 2015, Olaf Frohn. All rights reserved.
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met: 1. Redistributions of source code must retain the
// above copyright notice, this list of conditions and the following disclaimer. 2. Redistributions in
// binary form must reproduce the above copyright notice, this list of conditions and the following
// disclaimer in the documentation and/or other materials provided with the distribution. 3. Neither
// the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
// PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Codificación: cada posición son 4 caracteres en base 64 (ascensión recta en décimas de grado,
// 0–3599, y declinación + 90 en décimas de grado). En las estrellas siguen la magnitud
// ((mag + 1,5) × 10) y el color (índice B−V cuantizado de 0 a 15), un carácter cada uno.
// Coordenadas del año 2000.

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const v = (c) => ALFABETO.indexOf(c);
const pos = (s, i) => [((v(s[i]) * 64 + v(s[i + 1])) / 10), ((v(s[i + 2]) * 64 + v(s[i + 3])) / 10) - 90];

const ESTRELLAS = 'P1LdBDPAF1JEhbREPKiXEkPHroUIPCMYVQQHMSMyRCR8O4TFD0FIUCN4POUMg-EoVBuhPdXEdKENXBKyQpYMfdMUZBmqJ8aOSLScbJ10JcbDd_EvcBwgVJcDiXEkdIXxP8dCQXJieBRwTDfDdWFJfMpKIRfBMtPDfBMwSigCVnDLgDNJN4gBz5GugCNUNxgBTIGrhCePW0hCH_V3hGrIIshCZ7XuhJQvJ8hHgVVxiCpTHWiFToExiKODVFiDnaDSiMPiQoiDUgFhiDv4FNiCF8cBjGO9LQjBWLMtjME-RvjKYORKjKBtLQjJsWJ9kChFIYkJ1PGvkNAVSnkCCuTokMizZqkMNlMjkBpNQCkDHWUekCE2UrkLbtQWkDCOXjlCdwGalCS5H0lBVxEzlEkhSPlDfaWplDVaHSlNvwUXlHBlW5lKqEWHlMM-OBmBAXXTmFgCFtmBlhKimCndItmKidGqmCiNHemCZ3W4mDikSTnJy8PnnMpgH-nBBCHdnJb5WdnDoQLnnD2DSdnNRWJfoCx8X2oEV9FeoCwsTYoJ2GQcoCHIOtoNm9MaoDgpGrpBaVRRpDluK-pCcdGJpCcwLVpCNALSpEspJZpDj1MmpCk5PEpKEfRUpEdeKaqINRIvqCODT4qCDXXeqDgnQ8qGjGHVqBdlDRqBLmTQqMZRGWqIpDIPqBRFIRqNrAJaqLuWPuqMmcXrqImENfqMdwN2qFZHEAqBfRIVrDizLkrDNHNJrBpjOyrKMCNRrEmsRbrIobQUrKcuE5rBpCWPrIkiHorBM1K0rInHTArHBAB_rGm6JqrBrSKGrJAhQcrBlUEKrETDKRrFJJTDrEo1FZrMpGGRrCejPysII5R1sCzELjsEEpEcsEuSVHsC0SEpsLj5DVsDO9RlsNG-HxsDs6KysFeUUDsCldJ_sBRePXsCJTUUsBmVKEsEydNMsIHOWbsHW8D5sE1QSysIdTLfsCQBGKsKzyOBtJJTL9tMNMRXtCW5RytIqbJUtJfNKctIptHztGswQPtDaKVBtKFETitDj-ZStDniIItBzVIOtCItVitCchKitLO3JXtCQiKWtCLzU6tGd8DbtBiEUDtEtvScuJvtLwuHPyR_uLYUUjuNtBYpuJq4IUuMbLEOuCU6O_uJwWGruJZYLiuKNtIeuKnzFUuMocR8uDVEVkuEjIHfuBV7TcuMocT0vLWUFKvMoMYVvCPiHUvCr-J2vCWYWJvFieD6vEL-UgvCL8KkvMLVPKvGnwPivKpzISvK3caMvJxuSyvJj_HuvBmONVvJrBNnvIyWZGvBP8EZvEvUN8vChEJ5wJjUKHwNRjHTwMsfTLwCI4CewM1tLmwDBiS5wKotKKwBkIXSwKMOLiwCX-DIwCKtFewCYsEbwCo1FQwCOpRlwMClGxwIcvW-wDHPUIwMoUHUwFqKMiwJszJvwKaWQewCJ8ETwISVKLwKEeYBxCMrNsxBP1QFxFT8XjxItiOjxEkDHFxBf1N-xDUlPExHeTOmxMNGPnxCYHEfxMz_XKxMKgQjxE1MPwxCDdHTxMgaHjxBJaQBxCjpF7xIwpXuxIEbSsxGlgIExBpqSZxHwoDuxEsyNTxCVhE2xBYGRuxEYHUxyDB7XGyGCrMeyKjxTRyJSoFyyBgaHbyBGYOkyDnLUJyIXuQsyC1dGDyDagTPyLEELlyHjPUYyIQeJtyNrPG4yB1gYayJQBI_yCRMRgyF1hR6yIu1RHyMIuMiyIscKxyKsJTSyDWtPnyGXUFiyCz9PCyDKgREyJTZPgyMbFJFyIlGNiyCpULqyEhlG3zBKFIyzCNjLwzDrBZbzGvODuzHaiLwzJAxMszKFVGBzCnjIIzBiES0zLkBIZzMSJR4zIVPVczDRHQpzDvlMHzIbxOWzGc9EozLD1VqzKMaNAzCNdKkzGDSMyzJknJrzLpEElzCQITYzDUVFzzBWTHvzFekC5zKGpSVzCIAPezIpoD9zKX2MIzJ1_UrzCDlQdzJI9R1zCnoHczLSLIIzNbkDpzDwWQWzF0sOE0Fk9Qe0DKJQg0JqdGP0CWVX70FkQSn0EkrJa0Bg_YI0CxBE70K2SKw0KLYO80CUdI40BuYQ90LBcWf0BblVi0KEiGA0IL0Uf0KW3ET0JyyLd0F2lOl0IHzKq0NqGSo0ILgOc0BlJOx0DN7L20FqePk0DSdHu0JusPE0IIUMl0IIyR10CODWj0JxaU70N1oM40NIGPl0CioOX0Cp8W90Ky2B-0JEXMd0KmXRE0ExzUA0FpuOf1DVQGt1K0yV71DNCET1GNuKz1JPMM-1CsuKr1JtsWJ1DGrWz1NIzUu1FKRQz1JncE21MNPNq1BTwDv1KUWGy1HwbQj1CyRKk1Jz2SB1FibQN1DQwDD1JRaSa1JwvMl1DXFXS1EZiE31IafS_1GHaVF1JZhTa1JHgJi1GkhPt1ER7J41CtNWa1IvaVX1K3YVV1Jk1SL1DKxJS1IYiE51EbBY51NExOg1DmtOY1DpZVQ1BV1T01DgwHf1BisBu1LYdLc1MdZCz1CIwD81KIxTH1DKfQk1IqfSk1CquKx1EU6Em1CuaZD1IY5Gi1EYuPh1CdcY-2CdmGf2DJ7Hd2JlXQh2FNkGF2EO7I22IrHRe2KrkMy2LYBHf2D0aN22CCOUF2DK3L12Jm0Bv2IM8Ih2KmHEH2JqDT52LgxHE2BI1R42CigNL2FlYJg2BUjG42DulOO2G2UHA2JAYG72JEcRF2CjoGd2CXKSI2Kc6N92DG5Mr2JQLKS2NuvTj2JVqOb2CanFj2CfsH62KWqN52LdOGO2BJgPA2DjXGt2CkjLw2JmRVT2CTwNd2Cn3S52CtYLS2Ex2O42GaHE22KBCHP2EDkGZ2JG0WU2HKzNi2BlxK12CqOOh2DSDCu2JCrFc2CSBMk2JSIJi2DUgQ62JxHUg2DE1ZY3CPgLD3J2zK73JJuVh3COCHY3KtbHH3CteHu3CvfVh3MViEV3BVIUm3F0tHR3J1YRw3JclF43CKUIw3MlJI03CNvUL3KREDc3Hu5Cr3CUUIj3IJVTq3DyjVM3I2mE-3FEsKx3MfdWq3EOpNF3LYZCg3FauPt3Fl-LB3DVMDs3D';
const LINEAS = 'And|E2UrCuToBiS5AVSn,CPRuB2R3BgSpBiS5BcTV3ZU11_Ur,3ZU13fU_3YVV,CuToCOUFB9UfCuVcD1Vq,3fU_3tVU;Ant|WPIcYgJNZqIR;Aps|isBumTBxnMB9m0Bv;Aqr|wvMlw8MqydNMzyOB0aN20sOE08OD1oM42nMo2SKw,ydNMz0L5,zyOB0OM2,0sOE0jOS,2zK72nMo3iLS;Aql|uWPuuhPdusPEvUN8ulOOtiOjswQPuhPdtiOjsyNT;Ara|o1FQpEElncE2nzFUn1FwpGGRo1FZ;Ari|GpSVE-RvEfRUEcRF;Aur|ODVFMYVQL-UgLmTQMwSiODT4ODVFODWjMYVQLzU6L0Uf;Boo|gUQzgnQ8hbREiES0iEUDjPUYjxTRikSThbREibQN,iEUDhdVRhWWKhzWLhdVR;Cae|KlHCK9HhLBIRL5Ih;Cam|LnWeL3XgLfYbJAZNI-YTILXb,LfYbOzY5QaaG;Cnc|VCP7UgQ6UcRbUlSk,UgQ6TZPg;CVn|eUUDdcUi;CMa|O9LQP1LdQiKWQvJ8QeJtQXJiO3JX,RWJfQvJ8,P1LdQQLZQjLoQLMMQQLZ;CMi|R8O4RePX;Cap|vkMHvtLwwALSwrKHw6J3yRKkzELjyyLdyGLcxdLYvkMH;Car|PiHUPAF1VnDLX-DIZHEAYsEbYHEfVxEzToExSoFyTIGrUgFhVxEz,ZHEAaCEUaHEZaSEpaHE2ZiE3YsEb;Cas|EeYBDXXeCOXjBlW5AXXT;Cen|anFjcdGJdOGOdwGagCFtgpGrgaHbgaHjhFIYiNHejIHf,gaHjfRIV,iXEkgCFtg-Eo,dOGOclF4bBEy;Cep|wCX6wpXux8X2y7XQ0KW-z_XK0tXM1gYa3caMyWZGx8X2,yWZG1gYa;Cet|GYOkGGO8FyPZGcPpHBPdHIOtGYOkGPOHFcNmEXMdEELlBtLQAxMsCrMeDSMyEXMd;Cha|TeCDY1ByZNBfc2BrcHB2Y1By;Cir|j2E4ieD6kEEz;Col|O7I2NtIeNRIvM8Ih,NtIeOCHY;Com|e3Qze8SbdLSf;CrA|sfIRsyIRs6IJs7H7s3HvsqHfsIHSrgHd;CrB|kcS-kQSnkhSPk1SLlGSJlaSRlkSv;Crv|cdKNchKicwLVdTLfdeKachKi;Crt|bOMiawMXaiLwZxLNaPKgasLIawLTbiLMb-LY,aiLwawLT;Cru|d_EvcuE5,dKENdWFJ;Cyg|xuSywsTYvwUXuSVHtsWJtNWa,wgVJvwUXuvTjtvSc;Del|wLP1wWQWwbQjwtQlwlQbwWQW;Dor|KAGBKtFeNCETNeDzN1ENNCETL8FFKtFe;Dra|p8W9qEWHpCWPpHWsp8W9tBYprAZNoMYVmcXrllXOkIXSg_YIdcY-bBY5,rAZNrBZb,tBYpuaZD;Equ|x2O4xyPoxoPp;Eri|MCNRLKNjKzNiJ2NAJTL9I1MLIuMiIUMlG5MrGaL5GdLKHIKYHzKqIWKsI3KcKxJSKUIwKFIyI-IaIfHxH0HVG-HxGSH1FvGnFVGBEiGAD0FI;For|HgJiGnJAE3Jf;Gem|OpRlO9RlPyR_Q2SyRwTDSLScR0SRRMRgQkRSPiQoP1QF,RMRgRHQp;Gru|18F01dGD1PGv0uHPz5Gu1PGv,0tHR0LHnzzH5zVIO;Her|mXREmsRbnHTAnLUJm1UsmRVTl2VFlOUt,nHTAn3S5,nLUJocT0,qDT5oxT3ocT0n3S5ocR8pqSZqGSoqfSk,obQUmsRb;Hor|J7HdGWGIGKF3GSFjHLEvG_ED;Hya|UlPEUpO-UcOmUROlUOO9UlPEU6O_VqObWqN5WLMtXHLwX2MIYdLcZYLibFJFb2IxfNKchEJ5iyJs;Hyi|BAB_I4CeGPDZFiDVEfDgEpEc;Ind|wWGrwmF9xBE7zfFeyAFuwWGr;Lac|0fWO0yV70uVh0ZVV0wUz1JU_0uVh0hVz0fWO,0wUz0HUR0MT9;Leo|XxP8XuQsYORKaVRRbtQWaWQeXxP8,YORKYGRuXKSIW5Ry;LMi|XvTkYdTWZhTaYiTzXvTkWcTw;Lep|OTLvN7L2NjLwNALSMOLiL8KkM1K0NdKkNuKz,MPMDMOLiMfMA;Lib|jUKHizLkj1MmkjLwknJrkrJa,izLkkjLw;Lup|lJI0ktIskBIZj_HujGHVidGqjpF7j4GlkDHFkiHolgIElwIU,j_HukiHo;Lyn|O1XSQTXMRdVwTpU0VIUmV1T0V7Tc;Lyr|r8T8r7UQroUIr8T8sUT1sfTLsJTSr8T8;Men|OeCYM-CJLiCXL1C7;Mic|w1IywxHMyCHsx7JCxRJBw1Iy;Mon|SBMkTFNmQ4N_PMM-OpNF,Q4N_P8OcO_OyPWPNPqPn;Mus|bkDpc0DcdlDRd8DbekC5dZCzdlDR;Nor|lwHAmkGomSGOloGYlwHA;Oct|h3A_1XBWy2B-h3A_;Oph|qKMipuOfpjOypNQCnwPimtOYmENfmONVm9MaoQLn,nwPim9MamuLemkLLmcK8mgKa,pjOyoQLnotKKo6JZ;Ori|OXQYN2RPOORNOiQSOKPkN4POMtPDLhPq,LqOVLgOcLYO8LVPKLXPdLhPqLlQLL5QeMGQg,MSMyMrNsM-OBMtPDNGPnN4PONUNxNlMj,NUNxNJN4M-OB;Pav|v4FNwoDuvODusPEWrGEdqhEHpoD9r4C6u5CrwoDuyQD2;Peg|z9TQ1QSy2DSdAVSnAhQc2GQc1ZP-1MPwz9PCy8Pn,2GQc2DSd1hR61YRwz2SBy-SE;Per|IxTHJJTDJVTqJTUUIzUuItViIdVmH_V3HOWbGrWzG0WUHZV0HaVFHWUeHeUQHPUIG_URHBUeHWUe,JoV8J9VoJuVhItVi,HZV0GaVwEDV_;Phe|BCHdClGxDdHTDkGZCrFcClGxAYG7BCHd;Pic|P8EZNrFSNkGF;Psc|C4R6CzSxDHSVC4R6CzRWDlQdEHPgExOgEcOkD-O7DhPBC4PQCdPTB6PQ4OPJ3eO83APE2tO62lOl29OR3jOW3uOn3eO8,2lOl2EOq;PsA|1KJ210Jc1wI_1nI70zJBz5I6y-I6zFJPz5I61KJ2;Pup|PiHURFIRRyJoR7J4SVKLSoKfTDKRS5H0TIGr,SVKLSSKBSIJiRyJo;Pyx|S5H0UUIjUdI4UuJv;Ret|J8ETKBEzJVEeIwD8J8ET;Sge|uGQ4uYQ9u1RH,uJQzuYQ9;Sgr|q4IUrIIsrAJarSKGquKx,tbHHteHuspJZr-J2rSKG,usHhu3IjuuJ9t-KLthKPtJKHsWJ9r-J2rAJaqbJUrIIsspJZszJvsWJ9suKrs6KytOLGtYLStYLk,suKrscKxsTKhsWJ9;Sco|ldJ_lhKiluK-,lhKimVKEmqJ8m6JqndItniIInoHcoUHUpTHWptHzpgH-pKIR;Scl|CTJe30Jr2pI_3MIK;Sct|rkMysCNVr2MprVLyrkMy;Ser|k9QekyRJlEQ5lXQhk9QekhPtk5PElJOxmENf;Ser|oQLnpULqqKMiqUMyrBNnsZOu;Sex|XwOAXJMzYmNpYoN-;Tau|NMRXKyQpKgQjKJQgKRQzKgREMwSi,KJQgJaQBIGPlJgPA,IGPlIAPeIeOI;Tel|qoG4rPG4rUGZ;Tri|EbSsFETiFXTWEbSs;TrA|naDSlUEKj5DVnaDS;Tuc|0SEp2mE-BPEOAyD7AAD00oD60SEp;UMa|cvW-Z7XuZ3W4b5WdcvW-ePW0faWpgVVx,b5WdblViagTPafS_,blViaKVBYUUj,aKVBYHUx,Z7XuWVX7T8XjXFXSZ3W4,Z3W4XIWhWYWJVEVk,VPVcWYWJ;UMi|k4aOmMZ6j-ZSizZqk4aOnTa4pHbmF8cB;Vel|UgFhV9FeXUFiZRGWYBHfWTHvVaHSTIGr;Vir|blPFbxOWc6N9dwN2e3NNfdMUhcNIigNL,ejPyeTOmdwN2,e3NNf1N-g4OTioOX;Vol|VMDsTwDvTEDWREDcQwDDTEDWVMDs;Vul|tLRatqR7uoR1u7SavfSa';
const NOMBRES = 'And,Andrómeda,1,BkT2;Ant,Máquina Neumática,3,YFI_;Aps,Ave del Paraíso,3,l0CW;Aqr,Acuario,2,0WMW;Aql,Águila,1,uGOm;Ara,Altar,3,ouFO;Ari,Carnero,1,GLRU;Aur,Cochero,1,OOUo;Boo,Boyero,1,iYS6;Cae,Cincel,3,LCIJ;Cam,Jirafa,2,MgZA;Cnc,Cangrejo,2,URRK;CVn,Lebreles,2,evUV;CMa,Perro Mayor,1,QAKn;CMi,Perro Menor,2,R8PE;Cap,Capricornio,2,xVLQ;Car,Carina,1,UYEM;Cas,Casiopea,1,DGXy;Cen,Centauro,1,eoGu;Cep,Cefeo,2,1cZe;Cet,Ballena,1,D6M-;Cha,Camaleón,3,ZABu;Cir,Compás,3,iKEO;Col,Paloma,3,NvIl;Com,Pelo de Berenice,3,d-Rt;CrA,Corona Austral,3,rtHp;CrB,Corona Boreal,2,lITK;Crv,Cuervo,3,dKLM;Crt,Copa,3,atLl;Cru,Cruz del Sur,2,dLEq;Cyg,Cisne,1,wQVB;Del,Delfín,3,wgP5;Dor,Pez dorado,3,MSEy;Dra,Dragón,2,jgYi;Equ,Caballito,3,xqPS;Eri,Erídano,1,H0Js;For,Horno,3,GkJI;Gem,Gemelos,1,QlRm;Gru,Grulla,3,0oG0;Her,Hércules,2,oySS;Hor,Reloj,3,HrFv;Hya,Hidra,2,bML4;Hyi,Hidra Macho,3,FgDI;Ind,Indio,3,yAEO;Lac,Lagarto,3,0pVQ;Leo,León,1,ZAQG;LMi,León Menor,3,YBTF;Lep,Conejo,3,NDLG;Lib,Balanza,2,joLs;Lup,Lobo,3,jrHZ;Lyn,Lince,3,SvVf;Lyr,Lira,2,sMTz;Men,Mesa,3,MsB9;Mic,Microscopio,3,xJIZ;Mon,Unicornio,2,QaOE;Mus,Mosca,3,dgDG;Nor,Escuadra,3,lRGC;Oct,Bastón,3,zkBG;Oph,Ofiuco,2,oyM-;Ori,Orión,1,M-PA;Pav,Pavo,2,t-Dy;Peg,Pegaso,1,1SRC;Per,Perseo,1,HcVG;Phe,Fénix,2,CMGe;Pic,Paleta del Pintor,3,NYFt;Psc,Peces,2,BGQQ;PsA,Pez Austral,2,0PJS;Pup,Popa,2,RCJO;Pyx,Brújula,3,U_Jy;Ret,Retículo,3,JMEs;Sge,Flecha,3,uERB;Sgr,Sagitario,1,sxJn;Sco,Escorpión,1,nsJE;Scl,Escultor,3,BCJD;Sct,Escudo,3,rxMh;Ser,Serpiente,3,oAO2;Ser,Serpiente,3,oAO2;Sex,Sextante,3,YFNq;Tau,Toro,1,K8Qa;Tel,Telescopio,3,tTGG;Tri,Triángulo,3,FIS_;TrA,Triángulo Austral,2,lsD2;Tuc,Tucán,3,3vDy;UMa,Osa Mayor,1,ahV_;UMi,Osa Menor,2,iYaQ;Vel,Vela,2,WdGs;Vir,Virgen,1,fkNc;Vol,Pez Volador,3,SRDK;Vul,Zorro,3,vbR4';

// Las constelaciones del zodiaco, con el nombre que se usa en el resto del curso
const NOMBRE_COMUN = {
  Ari: 'Aries', Tau: 'Tauro', Gem: 'Géminis', Cnc: 'Cáncer', Leo: 'Leo', Vir: 'Virgo', Lib: 'Libra',
  Sco: 'Escorpio', Psc: 'Piscis', Car: 'Quilla',
};

// Estrellas con nombre propio (número del catálogo Hipparcos, nombre, posición, magnitud)
export const CON_NOMBRE = [
  [32349, 'Sirio', 'P1Ld', -1.44], [30438, 'Canopo', 'PAF1', -0.62], [69673, 'Arturo', 'hbRE', -0.05],
  [71683, 'Alfa Centauri', 'iXEk', -0.01], [91262, 'Vega', 'roUI', 0.03], [24608, 'Capela', 'MYVQ', 0.08],
  [24436, 'Rigel', 'MSMy', 0.18], [37279, 'Proción', 'R8O4', 0.4], [7588, 'Achernar', 'D0FI', 0.45],
  [27989, 'Betelgeuse', 'N4PO', 0.45], [68702, 'Beta Centauri', 'g-Eo', 0.61], [97649, 'Altair', 'uhPd', 0.76],
  [60718, 'Ácrux', 'dKEN', 0.77], [21421, 'Aldebarán', 'KyQp', 0.87], [65474, 'Espiga', 'fdMU', 0.98],
  [80763, 'Antares', 'mqJ8', 1.06], [37826, 'Pólux', 'SLSc', 1.16], [113368, 'Fomalhaut', '10Jc', 1.17],
  [102098, 'Deneb', 'wgVJ', 1.25], [62434, 'Mimosa', 'd_Ev', 1.25], [49669, 'Régulo', 'XxP8', 1.36],
  [36850, 'Cástor', 'RwTD', 1.58], [61084, 'Gácrux', 'dWFJ', 1.59], [25336, 'Bellatrix', 'MtPD', 1.64],
  [26311, 'Alnilam', 'NJN4', 1.69], [26727, 'Alnitak', 'NUNx', 1.74], [62956, 'Alioth', 'ePW0', 1.76],
  [15863, 'Mirfak', 'H_V3', 1.79], [54061, 'Dubhe', 'Z7Xu', 1.81], [67301, 'Alkaid', 'gVVx', 1.85],
  [11767, 'Polaris', 'F8cB', 1.97], [9884, 'Hamal', 'E-Rv', 2.01], [677, 'Alpheratz', 'AVSn', 2.07],
  [72607, 'Kochab', 'izZq', 2.07], [14576, 'Algol', 'HWUe', 2.09], [57632, 'Denébola', 'btQW', 2.14],
  [65378, 'Mizar', 'faWp', 2.23], [3179, 'Schedar', 'BlW5', 2.24], [25930, 'Mintaka', 'M-OB', 2.25],
  [746, 'Caph', 'AXXT', 2.28], [53910, 'Merak', 'Z3W4', 2.34], [58001, 'Phecda', 'b5Wd', 2.41],
  [59747, 'Delta Crucis', 'cuE5', 2.79], [17702, 'Pléyades', 'I5R1', 2.85], [59774, 'Megrez', 'cvW-', 3.32],
  [68756, 'Thuban', 'g_YI', 3.67], [104382, 'Sigma Octantis', 'xkAK', 5.45],
].map(([hip, nombre, p, mag]) => { const [ra, dec] = pos(p, 0); return { hip, nombre, ra, dec, mag }; });

let cache = null;
export function cielo() {
  if (cache) return cache;
  const estrellas = [];
  for (let i = 0; i < ESTRELLAS.length; i += 6) {
    const [ra, dec] = pos(ESTRELLAS, i);
    estrellas.push({ ra, dec, mag: v(ESTRELLAS[i + 4]) / 10 - 1.5, bv: (v(ESTRELLAS[i + 5]) / 15) * 2.4 - 0.4 });
  }
  const lineas = {};
  for (const parte of LINEAS.split(';')) {
    const [id, polis] = parte.split('|');
    const lista = polis.split(',').map((p) => {
      const puntos = [];
      for (let i = 0; i < p.length; i += 4) puntos.push(pos(p, i));
      return puntos;
    });
    (lineas[id] = lineas[id] || []).push(...lista);
  }
  const constelaciones = [];
  const vistas = new Set();
  for (const parte of NOMBRES.split(';')) {
    const [id, nombre, rango, p] = parte.split(',');
    if (vistas.has(id)) continue;
    vistas.add(id);
    const [ra, dec] = pos(p, 0);
    constelaciones.push({ id, nombre: NOMBRE_COMUN[id] || nombre, rango: +rango, ra, dec, lineas: lineas[id] || [] });
  }
  cache = { estrellas, constelaciones, conNombre: CON_NOMBRE };
  return cache;
}
