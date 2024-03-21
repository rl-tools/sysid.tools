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

        {
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

        }

        {
            this.predictive_plot_canvas_container = document.createElement('div')
            this.predictive_plot_canvas_container.style.width = "500px"
            this.predictive_plot_canvas_container.style.height = "500px"
            this.predictive_plot_canvas = document.createElement('canvas')
            this.predictive_plot_canvas.width = 400
            this.predictive_plot_canvas.height = 400
            this.predictive_plot_ctx = this.predictive_plot_canvas.getContext('2d');
            const color = 'rgb(0,123,255)'
            this.predictive_plot = new Chart(this.predictive_plot_ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                    {
                        label: 'Identity',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: [
                            {x: 0, y: 0},
                            {x: 100, y: 100}
                        ],
                        pointRadius: 0,
                        showLine: true,
                    },
                    {
                        label: 'Predictions',
                        backgroundColor: color,
                        borderColor: color,
                        data: [{x: 0, y: 0.5}, {x: 1, y: 1}, {x: 2, y: 4}, {x: 3, y: 9}],
                        pointRadius: 0.5,
                        // showLine: true,
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
                                text: 'Predicted Thrust [N]'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Actual Thrust [N]'
                            }
                        }
                    },
                    animations: false
                }
            });
            this.predictive_plot_canvas_container.style.display = "none"
            this.predictive_plot_canvas_container.appendChild(this.predictive_plot_canvas)
        }
        this.result_container = document.createElement('div')
        this.result_container.style.width = "100%"
        this.result_heading = document.createElement('h3')
        this.result_heading.textContent = "Motor Parameters"
        this.result_container.appendChild(this.result_heading)
        this.result_description = document.createElement('div')
        this.result_description.textContent = "Estimated motor parameters. The outer dimension is the motor number and the inner dimension contains the parameters for each exponent of the quadratic polynomial thrust curve"
        this.result_container.appendChild(this.result_description)
        this.result_container_text = document.createElement('div')
        this.result_container_text.classList.add("fancy-json-output")
        this.result_container.appendChild(this.result_container_text)
        this.result_container.style.display = "none"

        this.container.appendChild(this.options_container)
        this.container.appendChild(this.progressBarContainer);
        this.container.appendChild(this.tau_plot_canvas_container)
        this.container.appendChild(document.createElement('br'))
        this.container.appendChild(this.predictive_plot_canvas_container)
        this.container.appendChild(this.result_container)
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
            const flights = this.thrust_timeframes
            let current_i = 0;
            const number_of_steps = this.globals.debug ? 10: 100
            const T_ms = linspace(parseFloat(this.start_range_input.value), parseFloat(this.end_range_input.value), number_of_steps)

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
                const T_m_optimal = T_ms[min_rmse_i]
                const motor_parameters_optimal = interval_handle.motor_parameters[min_rmse_i]
                this.tau_plot.data.datasets[1].data = data
                this.tau_plot.data.datasets[0].data = [{x: T_ms[min_rmse_i], y: min_rmse}, {x: T_ms[min_rmse_i], y: max_rmse}]
                this.tau_plot.data.datasets[0].label = `Optimal: T_m = ${T_m_optimal.toFixed(3)}s`
                this.tau_plot.update()
                this.tau_plot_canvas_container.style.display = "block"
                this.tau_plot.update()
                this.epilogue(flights, T_m_optimal, motor_parameters_optimal)
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

    async epilogue(flights, T_m_optimal, motor_parameters_optimal){
        const m = await this.module
        const combined = m.combine_motor_model(flights, T_m_optimal, JSON.stringify(this.model), motor_parameters_optimal)
        const data = m.get_combined_flight_data(combined)
        this.plot_predictions(motor_parameters_optimal, data)
        for(const listener of this.listeners){
            listener.callback({"event": "motor-model", "data": {
                T_m: T_m_optimal,
                motor_parameters: motor_parameters_optimal
            }})
        }
    }
    async plot_predictions(motor_parameters, data){
        const mass = this.model["mass"]
        const scatter_data = []
        let xy_min = Infinity
        let xy_max = -Infinity
        for(let step_i=0; step_i<data["thrusts"][0].length; step_i++){
            let predicted_thrust = 0
            for(let motor_i=0; motor_i < 4; motor_i++){
                predicted_thrust += data["thrusts"][motor_i][step_i]
            }
            const x_val = predicted_thrust
            const y_val = data["acceleration"][2][step_i] * mass
            scatter_data.push({
                x: x_val,
                y: y_val
            })
            if(x_val < xy_min){
                xy_min = x_val
            }
            if(x_val > xy_max){
                xy_max = x_val
            }
            if(y_val < xy_min){
                xy_min = y_val
            }
            if(y_val > xy_max){
                xy_max = y_val
            }
        }
        this.predictive_plot.data.datasets[1].data = scatter_data
        this.predictive_plot.data.datasets[0].data = [{x: xy_min, y: xy_min}, {x: xy_max, y: xy_max}]
        this.predictive_plot.update()
        this.predictive_plot_canvas_container.style.display = "block"
        this.predictive_plot.update()

        this.result_container_text.textContent = JSON.stringify(motor_parameters.read(), null, 2)
        this.result_container.style.display = "block"
    }
}