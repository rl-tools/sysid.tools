import {Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler } from '../external/chartjs/auto/auto.js' //#https://cdn.skypack.dev/chart.js@4';
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler);
// import annotationPlugin from 'https://cdn.skypack.dev/chartjs-plugin-annotation@3';


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
        this.find_tau_header = document.createElement('h1')
        this.find_tau_header.style.textAlign = "center"
        this.find_tau_header.textContent = "Finding the Motor Time Constant (Tau)"
        this.options_container = document.createElement('div')
        this.start_range_label = document.createElement('label')
        this.start_range_label.textContent = "Start Range (s):"
        this.start_range_input = document.createElement('input')
        this.start_range_input.type = "number"
        this.start_range_input.value = 0.005
        this.options_container.appendChild(this.start_range_label)
        this.options_container.appendChild(this.start_range_input)
        this.end_range_label = document.createElement('label')
        this.end_range_label.textContent = "End Range (s):"
        this.end_range_input = document.createElement('input')
        this.end_range_input.type = "number"
        this.end_range_input.value = 0.2
        this.options_container.appendChild(document.createElement('br'))
        this.options_container.appendChild(this.end_range_label)
        this.options_container.appendChild(this.end_range_input)

        this.tau_plot_canvas_container = document.createElement('div')
        this.tau_plot_canvas_container.style.width = "500px"
        this.tau_plot_canvas_container.style.height = "500px"
        this.tau_plot_canvas = document.createElement('canvas')
        this.tau_plot_canvas.width = 400
        this.tau_plot_canvas.height = 400
        this.tau_plot_ctx = this.tau_plot_canvas.getContext('2d');
        this.tau_plot = new Chart(this.tau_plot_ctx, {
            type: 'line',
            data: {
                labels: [0, 1, 2, 3, 4],
                datasets: [{
                    label: 'RMSE',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [0, 1, 2, 3, 4],
                    pointRadius: 0
                    // fill: false,
                }]
            },
            options: {
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
        // this.tau_plot_canvas_container.style.display = "none"
        this.tau_plot_canvas_container.appendChild(this.tau_plot_canvas)

        this.container.appendChild(this.find_tau_header)
        this.container.appendChild(this.options_container)
        this.container.appendChild(this.tau_plot_canvas_container)
        this.parent.appendChild(this.container)

        this.module = globals.module
        this.listeners = []
        this.model = null
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
                this.tau_plot.data.datasets[0].data = interval_handle.motor_parameters.map(x=>x.getRMSE())
                this.tau_plot_canvas_container.style.display = "block"
            }

            const callback = () => {
                const T_m = T_ms[current_i]
                current_i += 1
                if(current_i >= T_ms.length){
                    clearInterval(interval_handle.interval)
                    final()
                }
                const combined = m.combine(flights, T_m)
                const motor_parameters = m.estimate_motor_parameters(JSON.stringify(this.model), combined, true)
                interval_handle.motor_parameters.push(motor_parameters)
            }

            interval_handle.interval = setInterval(callback, 100)
        }
    }
}