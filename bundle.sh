npm install esbuild --save-dev 
npx esbuild dependencies/chart.js --bundle --minify --format=esm --outfile=blob/lib/chart.js