import {Chart, LineController, ScatterController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler, Legend} from 'https://cdn.skypack.dev/chart.js@4';
Chart.register(LineController, ScatterController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler, Legend);


function linspace(start, end, num) {
    const arr = new Array(num);
    const step = (end - start) / (num - 1);
    for (let i = 0; i < num; i++) {
        arr[i] = start + (step * i);
    }
    return arr;
}

export class FindTauStep{
    constructor(globals, parent){
        this.globals = globals
        this.parent = parent
        this.container = document.createElement('div')
        this.container.style.display = "flex"
        this.container.style.flexDirection = "column"
        this.container.style.alignItems = "center"
        this.options_container = document.createElement('div')
        this.start_range_label = document.createElement('label')
        this.start_range_label.textContent = "Start Range (s):"
        this.start_range_label.style.marginRight = "10px"
        this.start_range_input = document.createElement('input')
        this.start_range_input.classList.add("fancy-number-input")
        // class= type="number" placeholder="seed">
        this.start_range_input.type = "number"
        this.start_range_input.value = 0.005
        this.options_container.appendChild(this.start_range_label)
        this.options_container.appendChild(this.start_range_input)
        this.end_range_label = document.createElement('label')
        this.end_range_label.textContent = "End Range (s):"
        this.end_range_label.style.marginRight = "10px"
        this.end_range_input = document.createElement('input')
        this.end_range_input.classList.add("fancy-number-input")
        this.end_range_input.type = "number"
        this.end_range_input.value = 0.2
        this.options_container.appendChild(document.createElement('br'))
        this.options_container.appendChild(document.createElement('br'))
        this.options_container.appendChild(this.end_range_label)
        this.options_container.appendChild(this.end_range_input)

        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.style.width = '50%';
        this.progressBarContainer.style.backgroundColor = '#e0e0e0';
        this.progressBarContainer.style.borderRadius = '8px';
        this.progressBarContainer.style.position = 'relative';
        this.progressBarContainer.style.height = '30px';
        this.progressBarContainer.style.margin = '20px 0';

        this.progressBar = document.createElement('div');
        this.progressBar.style.height = '100%';
        this.progressBar.style.width = '0%';
        this.progressBar.style.backgroundColor = '#4caf50';
        this.progressBar.style.borderRadius = '8px';
        this.progressBar.style.textAlign = 'center';
        this.progressBar.style.lineHeight = '30px';
        this.progressBar.style.color = 'white';
        this.progressBar.innerText = '0%';

        this.progressBarContainer.appendChild(this.progressBar);
        this.tau_plot_canvas_container = document.createElement('div')
        this.tau_plot_canvas_container.style.width = "500px"
        this.tau_plot_canvas_container.style.height = "500px"
        this.tau_plot_canvas = document.createElement('canvas')
        this.tau_plot_canvas.width = 400
        this.tau_plot_canvas.height = 400
        this.tau_plot_ctx = this.tau_plot_canvas.getContext('2d');
        const color = 'rgb(0,123,255)'
        this.tau_plot = new Chart(this.tau_plot_ctx, {
            type: 'scatter',
            data: {
                datasets: [
                {
                    label: 'Optimal',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [
                        {x: 2, y: 0},
                        {x: 2, y: 9}
                    ],
                    pointRadius: 0,
                    showLine: true,
                },
                {
                    label: 'RMSE',
                    backgroundColor: color,
                    borderColor: color,
                    data: [{x: 0, y: 0.5}, {x: 1, y: 1}, {x: 2, y: 4}, {x: 3, y: 9}],
                    pointRadius: 0,
                    showLine: true,
                },
            ]
            },
            options: {
                plugins: {
                    legend:{
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Motor Time Constant [s]'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'RMSE (Predicted Thrust)'
                        }
                    }
                },
                animations: false
            }
        });
        this.tau_plot_canvas_container.style.display = "none"
        this.tau_plot_canvas_container.appendChild(this.tau_plot_canvas)

        this.container.appendChild(this.options_container)
        this.container.appendChild(this.progressBarContainer);
        this.container.appendChild(this.tau_plot_canvas_container)
        this.parent.appendChild(this.container)

        this.module = globals.module
        this.listeners = []
        this.model = null
    }
    updateProgressBar(progress) {
        const val = Math.round(Math.max(0, Math.min(100, progress)))
        this.progressBar.style.width = val + '%';
        this.progressBar.innerText = val + '%';
    }

    registerListener(listener){
        this.listeners.push(listener)
    }
    async callback(event){
        if(event.event == "model"){
            this.model = event.data
        }
        if(event.event == "thrust-timeframes"){
            this.thrust_timeframes = event.data
        }
        if(this.model && this.thrust_timeframes){
            const m = await this.module
            const flights = event.data
            let current_i = 0;
            const T_ms = linspace(parseFloat(this.start_range_input.value), parseFloat(this.end_range_input.value), 100)

            const interval_handle = {motor_parameters:[]}

            const final = () => {
                this.tau_plot.data.labels = T_ms
                const rmses = interval_handle.motor_parameters.map(x=>x.getRMSE())
                const data = []
                let min_rmse = Infinity
                let min_rmse_i = 0
                let max_rmse = -Infinity
                let max_rmse_i = 0
                for(let t_m_i = 0; t_m_i < T_ms.length; t_m_i++){
                    const T_m = T_ms[t_m_i]
                    const rmse = rmses[t_m_i]
                    data.push({x: T_m, y: rmse})
                    if(rmse < min_rmse){
                        min_rmse = rmse
                        min_rmse_i = t_m_i
                    }
                    if(rmse > max_rmse){
                        max_rmse = rmse
                        max_rmse_i = t_m_i
                    }
                }
                this.tau_plot.data.datasets[1].data = data
                this.tau_plot.data.datasets[0].data = [{x: T_ms[min_rmse_i], y: min_rmse}, {x: T_ms[min_rmse_i], y: max_rmse}]
                this.tau_plot.data.datasets[0].label = `Optimal: T_m = ${T_ms[min_rmse_i].toFixed(3)}s`
                this.tau_plot_canvas_container.style.display = "block"
            }

            const default_delay = 200
            let last_update = null

            const callback = () => {
                this.updateProgressBar(current_i / (T_ms.length-1) * 100)
                const T_m = T_ms[current_i]
                current_i += 1
                const combined = m.combine(flights, T_m)
                const motor_parameters = m.estimate_motor_parameters(JSON.stringify(this.model), combined, true)
                interval_handle.motor_parameters.push(motor_parameters)
                let delay = default_delay
                if(last_update){
                    const now = Date.now()
                    const elapsed = now - last_update
                    delay = elapsed * 0.1
                    last_update = now
                }
                if(current_i >= T_ms.length){
                    final()
                }
                else{
                    setTimeout(callback, delay)
                }
            }
            setTimeout(callback, default_delay)
        }
    }
}