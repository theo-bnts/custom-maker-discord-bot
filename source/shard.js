const { ShardingManager } = require('discord.js')
const os = require('os')
const config = require('./assets/config.json')

const shards = new ShardingManager('./main.js', {
    totalShards: 'auto',
    token: os.type().toLocaleLowerCase().startsWith('l') ? config.tokens.public : config.tokens.beta
})

shards.on('shardCreate', shard => console.log(`shard ${shard.id} up`))

shards.spawn(shards.totalShards, 1000)