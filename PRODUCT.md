# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript for the presentation surface; FastAPI + PostgreSQL for the API and data layer; Docker Compose for local execution.

## Users

The presenting group uses the site during an in-class academic presentation. Professor Onildo dos Reis Freire and classmates can follow the narrative, inspect calculations, and revisit the public result afterward from a phone or computer.

## Product Purpose

Turn the Titanic descriptive-statistics project into a credible, memorable, interactive report. Success means the analysis is visually clear, every result can be verified from the source data, and the group can present it reliably through a public URL.

## Positioning

Unlike a slide export or generic KPI dashboard, this is a guided academic presentation where every data card can disclose its formula, operands, source, and statistical interpretation.

## Operating Context

The source of truth is the Kaggle Titanic `train.csv` with 891 passenger records. The sequence follows the group presentation: Cauany, Bruna, Samuel, Nikson, then Kevin. The existing Canva/PDF establishes the calculations, charts, source language, and required statistical cautions.

## Capabilities and Constraints

- Public, read-only audience experience; no login is required to view the presentation.
- Keyboard and click navigation advances or returns between sections; the browser's right-click behavior remains intact.
- A local Docker environment must run independently on ports 3011, 8086, and 5440.
- The production target is Azure later; its database identity, credentials, and data boundary must remain isolated from other projects.

## Brand Commitments

Preserve the academic identity already established in the Canva: deep navy as the anchor, warm orange for discoveries/survival, muted violet for contrast, a serious editorial tone, and team photos used as authorship cues rather than decoration.

## Evidence on Hand

- `train.csv`: canonical Titanic dataset.
- `01_analise/Análise Estatística Descritiva - Titanic.pdf`: approved presentation content.
- `06_membros_equipe/`: headshots for Bruna Xavier, Cauany Nunes, Kevin Kennedy, Nikson Gabriel, and Samuel Soares.
- Existing analysis notebooks, scripts, and chart exports under `01_analise/`, `graficos_titanic/`, and `graficos_final/`.

## Product Principles

- A visual claim always has a reproducible calculation behind it.
- The main narrative remains legible before the details are opened.
- Interaction helps explain statistics; it never competes with the presenter.
- The experience must remain dependable on a classroom projector, phone, and ordinary internet connection.

## Accessibility & Inclusion

Keyboard navigation, visible focus, semantic controls, sufficient contrast, and reduced-motion behavior are required. Charts must carry textual values and never depend on color alone.
