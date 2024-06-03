/// <reference types="discord.js" />

import * as Discord from 'discord.js';

declare module "discord.js" {
    export interface Command {
        data: Discord.SlashCommandBuilder;
        execute: (interaction: Discord.CommandInteraction) => Promise<void>;
    }

    export interface Client {
        commands: Discord.Collection<string, Command>;
    }
}
