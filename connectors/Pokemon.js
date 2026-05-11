const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://pokeapi.co/api/v2";

const handler = async ({ action, name, id }) => {
    const ref = (name ?? id ?? "").toString().toLowerCase();

    switch (action) {
        case "pokemon": {
            if (!ref) return utilities.sendify({ error: "name or id is required" });
            const res = await fetch(`${base}/pokemon/${ref}`);
            if (!res.ok) return utilities.sendify({ error: `Pokemon '${ref}' not found` });
            const data = await res.json();
            return utilities.sendify({
                id: data.id,
                name: data.name,
                height: data.height,
                weight: data.weight,
                base_experience: data.base_experience,
                types: data.types.map(t => t.type.name),
                abilities: data.abilities.map(a => ({ name: a.ability.name, hidden: a.is_hidden })),
                stats: Object.fromEntries(data.stats.map(s => [s.stat.name, s.base_stat])),
                sprite: data.sprites.front_default,
                moves_count: data.moves.length
            });
        }
        case "species": {
            if (!ref) return utilities.sendify({ error: "name or id is required" });
            const res = await fetch(`${base}/pokemon-species/${ref}`);
            if (!res.ok) return utilities.sendify({ error: `Species '${ref}' not found` });
            const data = await res.json();
            const flavor = data.flavor_text_entries.find(e => e.language.name === "en")?.flavor_text.replace(/\s+/g, " ");
            return utilities.sendify({
                id: data.id,
                name: data.name,
                generation: data.generation.name,
                color: data.color.name,
                habitat: data.habitat?.name,
                is_legendary: data.is_legendary,
                is_mythical: data.is_mythical,
                evolution_chain: data.evolution_chain.url,
                flavor_text: flavor
            });
        }
        case "ability": {
            if (!ref) return utilities.sendify({ error: "name is required" });
            const res = await fetch(`${base}/ability/${ref}`);
            if (!res.ok) return utilities.sendify({ error: `Ability '${ref}' not found` });
            const data = await res.json();
            const effect = data.effect_entries.find(e => e.language.name === "en");
            return utilities.sendify({
                name: data.name,
                effect: effect?.effect,
                short_effect: effect?.short_effect,
                pokemon_with_ability: data.pokemon.slice(0, 20).map(p => p.pokemon.name)
            });
        }
        case "move": {
            if (!ref) return utilities.sendify({ error: "name is required" });
            const res = await fetch(`${base}/move/${ref}`);
            if (!res.ok) return utilities.sendify({ error: `Move '${ref}' not found` });
            const data = await res.json();
            const effect = data.effect_entries.find(e => e.language.name === "en")?.short_effect;
            return utilities.sendify({
                name: data.name,
                type: data.type.name,
                damage_class: data.damage_class.name,
                power: data.power,
                accuracy: data.accuracy,
                pp: data.pp,
                priority: data.priority,
                effect
            });
        }
        case "type": {
            if (!ref) return utilities.sendify({ error: "name is required" });
            const res = await fetch(`${base}/type/${ref}`);
            if (!res.ok) return utilities.sendify({ error: `Type '${ref}' not found` });
            const data = await res.json();
            return utilities.sendify({
                name: data.name,
                damage_relations: {
                    double_damage_to: data.damage_relations.double_damage_to.map(t => t.name),
                    half_damage_to: data.damage_relations.half_damage_to.map(t => t.name),
                    no_damage_to: data.damage_relations.no_damage_to.map(t => t.name),
                    double_damage_from: data.damage_relations.double_damage_from.map(t => t.name),
                    half_damage_from: data.damage_relations.half_damage_from.map(t => t.name),
                    no_damage_from: data.damage_relations.no_damage_from.map(t => t.name)
                }
            });
        }
        case "random": {
            const randomId = Math.floor(Math.random() * 1025) + 1;
            const res = await fetch(`${base}/pokemon/${randomId}`);
            const data = await res.json();
            return utilities.sendify({
                id: data.id,
                name: data.name,
                types: data.types.map(t => t.type.name),
                sprite: data.sprites.front_default
            });
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "Pokemon",
    handler,
    params: {
        action: z.enum(["pokemon", "species", "ability", "move", "type", "random"]).describe("pokemon = full stats, species = lore/dex entry, ability/move/type = mechanics info, random = surprise Pokémon"),
        name: z.string().optional().describe("Name to look up (e.g. 'pikachu', 'thunderbolt', 'electric')"),
        id: z.union([z.string(), z.number()]).optional().describe("Numeric ID. Either name or id works for pokemon/species")
    }
};