# Todo — wind-sentinel

## En cours
<!-- Tâches actuellement en développement -->

## À faire
- [ ] Phase 2 : Animation particules (Leaflet-velocity) — tester visuellement l'animation dans le navigateur
- [ ] Phase 2 : Graphique 24h par station — tester le popup StationDetail
- [ ] Phase 2 : Mode prévision (slider temporel 0h–48h)
- [ ] Phase 2 : Filtre par vitesse minimale (slider)
- [ ] Phase 2 : Couches toggleables avancées
- [ ] Phase 3 : Intégration SYNOP réel (explorer API Météo-France v2 ou data.gouv.fr v2)
- [ ] Phase 3 : Réintégrer grille 0.5° avec rate limiting correct (actuellement 1°)
- [ ] Perf : code splitting frontend (bundle > 500KB)

## Terminé
- [x] [2026-04-21] Création du CLAUDE.md, plan architecture, configuration MCP + hooks
- [x] [2026-04-21] Backend FastAPI : endpoints /api/stations + /api/grid + /api/forecast
- [x] [2026-04-21] Services Open-Meteo (grille + stations + prévisions)
- [x] [2026-04-21] Frontend React : carte Leaflet, marqueurs, contrôles, légende, popup
- [x] [2026-04-21] 16 tests pytest verts
- [x] [2026-04-21] Intégration end-to-end vérifiée (42 stations réelles, grille 16×11)
