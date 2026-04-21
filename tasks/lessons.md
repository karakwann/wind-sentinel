# Lessons — wind-sentinel

Leçons apprises au fil des sessions. Format : `[date] | ce qui a mal tourné | règle pour l'éviter`

[2026-04-21] | URLs SYNOP data.gouv.fr (object.files.data.gouv.fr/meteofrance/data/synop/) retournent 404 — service indisponible ou URL changée | Utiliser Open-Meteo comme source principale pour les observations ponctuelles (plus robuste), garder SYNOP en option future

[2026-04-21] | La Réunion (-20.90°) était incluse dans la liste des stations → 400 Bad Request sur l'API AROME | Toujours filtrer les stations sur le bounding box France métropolitaine (41–52°N, -6–11°E) avant tout appel AROME

[2026-04-21] | Convention U/V inversée → animation dans le mauvais sens | Toujours vérifier : U = -speed*sin(dir_rad), V = -speed*cos(dir_rad) avec direction météo (d'où vient le vent)

[2026-04-21] | Open-Meteo retourne 429 sur 4 batchs consécutifs (grille 0.5°, ~500 pts) | Utiliser résolution 1° pour la grille (176 pts, 1 seul batch) ; si résolution fine nécessaire, ajouter délai 1s entre batchs + retry exponentiel

[2026-04-21] | Vite s'arrête si lancé depuis le mauvais répertoire | Toujours lancer Vite depuis /frontend avec `node_modules/.bin/vite`
