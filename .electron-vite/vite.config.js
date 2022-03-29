const { join } = require("path")
const vuePlugin = require("@vitejs/plugin-vue")
const vueJsx = require("@vitejs/plugin-vue-jsx");
const { defineConfig } = require("vite")

const Pages = require('vite-plugin-pages')
const Layouts = require('vite-plugin-vue-layouts')
const AutoImport = require('unplugin-auto-import/vite')
const userConfig = require("../config")
const Components = require('unplugin-vue-components/vite')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
const unocss = require('unocss/vite')
const IsWeb = process.env.BUILD_TARGET === 'web'

function resolve(dir) {
    return join(__dirname, '..', dir)
}
userConfig.build.env.is_web = IsWeb
userConfig.dev.env.is_web = IsWeb

const root = resolve('src/renderer')


function range(size, startAt = 1) {
    return Array.from(Array(size).keys()).map(i => i + startAt)
}

const config = defineConfig({
    mode: process.env.NODE_ENV,
    root,
    define: {
        'process.env': process.env.NODE_ENV === 'production' ? userConfig.build.env : userConfig.dev.env
    },
    resolve: {
        alias: {
            '@renderer': root,
            '@store': join(root, '/store'),
        }
    },
    base: './',
    build: {
        outDir: IsWeb ? resolve('dist/web') : resolve('dist/electron/renderer'),
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild'
    },
    server: {
    },
    plugins: [
        vueJsx(),
        vuePlugin({
            reactivityTransform: true,
            script: {
                refSugar: true
            }
        }),
        // https://github.com/hannoeru/vite-plugin-pages
        Pages.default({
            dirs: resolve('src/renderer/views'),
            extensions: ['vue', 'md'],
        }),

        // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
        Layouts.default({
            layoutsDirs: resolve('src/renderer/layouts')
        }),

        // https://github.com/antfu/unplugin-auto-import
        AutoImport({
            imports: [
                'vue',
                'vue-router',
                'vue-i18n',
                'pinia',
                '@vueuse/head',
                '@vueuse/core',
            ],
            dts: 'auto-imports.d.ts',
        }),
        unocss.default(),
        // https://github.com/antfu/unplugin-vue-components
        Components({
            dirs: [resolve('src/renderer/components')],
            // allow auto load markdown components under `./src/components/`
            extensions: ['vue', 'md'],
    
            // allow auto import and register components used in markdown
            include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    
            // custom resolvers
            resolvers: [
                ElementPlusResolver(),
                // AntDesignVueResolver(),
                // auto import icons
                // https://github.com/antfu/unplugin-icons
                // IconsResolver({
                //     componentPrefix: '',
                //     // enabledCollections: ['carbon']
                // }),
            ],
    
            dts: resolve('src/renderer/components.d.ts'),
        }),
        // WindiCSS.default({
        //     safelist: '',
        //     scan: {
        //         dirs: ['.'], // all files in the cwd
        //         fileExtensions: ['vue', 'js', 'ts'], // also enabled scanning for js/ts
        //     },            
        // }),
    ],
    optimizeDeps: {
    },
    publicDir: resolve('static')
})

module.exports = config