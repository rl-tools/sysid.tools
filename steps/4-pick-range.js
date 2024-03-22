import {RangePickerChart} from '../range_picker_chart.js';

const default_ranges = {
    "ranges-thrust": [
        {"flight": 0, "start": 75, "end": 115}
    ],
    "ranges-inertia-roll-pitch": [
        {"flight": 1, "start": 190, "end": 205},
        {"flight": 1, "start": 210, "end": 220},
        {"flight": 2, "start": 250, "end": 280}
    ],
    "ranges-inertia-yaw": [
        {"flight": 3, "start": 345, "end":380}
    ]
}

export class PickRangeStep{
    constructor(globals, parent, title, event_name){
        this.globals = globals
        this.parent = parent
        this.title = title
        this.event_name = event_name
        this.container = document.createElement('div')
        this.pick_thrust_header = document.createElement('h3')
        this.pick_thrust_header.style.textAlign = "center"
        this.pick_thrust_header.textContent = "Waiting for files to be processed..."
        this.container.appendChild(this.pick_thrust_header)
        this.parent.appendChild(this.container)
        this.listeners = []
        this.ranges = null
        if(globals.debug){
            this.ranges = default_ranges[event_name]
        }
        this.resize_canvas_functions = []
        this.resize_observer = null
    }

    registerListener(listener){
        this.listeners.push(listener)
    }

    async callback(event){
        if(event.event == "files-processed"){
            this.parent.removeChild(this.container)
            this.container = document.createElement('div')
            this.container.style.textAlign = "center"
            const names = event.data.names
            const flights = event.data.flights
            const flight_data = event.data.flight_data
            const excitation_metrics = event.data.excitation_metrics
            this.range_pickers = []
            this.resize_canvas_functions = []
            for(var log_file_i=0; log_file_i < flight_data.length; log_file_i++){
                const current_excitation_metrics = excitation_metrics[log_file_i];
                const current_flight_data = flight_data[log_file_i];
                const log_file_path = names[log_file_i];
                const title_container = document.createElement('h2');
                title_container.textContent = "File: \"" + log_file_path + "\"";
                title_container.style.textAlign = "center";
                const canvas_container = document.createElement('div');
                canvas_container.style.width = "100%";
                canvas_container.style.height = "1000px";
                this.container.appendChild(title_container);
                this.container.appendChild(canvas_container);
                const range_picker_chart = new RangePickerChart(canvas_container);
                this.range_pickers.push(range_picker_chart)
                const timeseries_motor_commands = [0, 1, 2, 3].map(x=>`actuator_motors_control[${x}]`).map(
                    name => ({name, data: current_flight_data[name]})
                )
                const timeseries_groups = [
                    {
                        name: "Motor Commands",
                        timeseries: timeseries_motor_commands
                    },
                    {
                        name: "Thrust Excitation",
                        timeseries: [{name: "Thrust Excitation", data: current_excitation_metrics.thrust}]
                    },
                    {
                        name: "Torque Excitation (Roll, Pitch)",
                        timeseries: [
                            {name: "Torque Excitation Roll", data: current_excitation_metrics.torque_x},
                            {name: "Torque Excitation Pitch", data: current_excitation_metrics.torque_y}
                        ]
                    },
                    {
                        name: "Torque Excitation (Yaw)",
                        timeseries: [
                            {name: "Torque Excitation (Yaw)", data: current_excitation_metrics.torque_z},
                        ]
                    }
                ]
                range_picker_chart.setTimeSeries(timeseries_groups)

                function resizeCanvas(){
                    const dpr = window.devicePixelRatio || 1;
                    range_picker_chart.resizeCanvas(dpr);
                }
                window.addEventListener('resize', resizeCanvas);

                

                this.resize_canvas_functions.push(resizeCanvas)
            }
            const range_input_submit = document.createElement('input')
            range_input_submit.type = "button"
            range_input_submit.value = "Set Ranges"
            range_input_submit.classList.add("fancy-button")
            range_input_submit.classList.add("fancy-button-small")

            this.container.appendChild(range_input_submit)
            this.container.appendChild(document.createElement('br'))
            this.parent.appendChild(this.container)

            if(this.ranges){
                this.setRanges(this.ranges)
            }

            for(const resize_canvas_function of this.resize_canvas_functions){
                resize_canvas_function()
            }
            this.resize_observer = new ResizeObserver((entries) => {
                for(const resize_canvas_function of this.resize_canvas_functions){
                    resize_canvas_function()
                }
            })
            this.resize_observer.observe(this.container)

            if(this.globals.debug){
                setTimeout(()=>{
                    const file_ranges = this.getRanges()
                    for(const listener of this.listeners){
                        listener.callback({"event": this.event_name, "data": file_ranges})
                    }
                }, 200)
            }

            range_input_submit.addEventListener('click', ()=>{
                const file_ranges = this.getRanges()
                if(file_ranges.length == 0){
                    alert("Please select at least one range")
                }
                else{
                    for(const listener of this.listeners){
                        listener.callback({"event": this.event_name, "data": file_ranges})
                    }
                }

            })
        }
    }
    getRanges(){
        const file_ranges = []
        for(var log_file_i=0; log_file_i < this.range_pickers.length; log_file_i++){
            const ranges = this.range_pickers[log_file_i].getSelections()
            for(const range of ranges){
                file_ranges.push({
                    file: log_file_i,
                    start: range.start,
                    end: range.end,
                })
            }
        }
        return file_ranges
    }
    setRanges(ranges){
        const flight2ranges = {}
        for(const range of ranges){
            flight2ranges[range.flight] = flight2ranges[range.flight] || []
            flight2ranges[range.flight].push({start: range.start, end: range.end})
        }
        for(const [flight, ranges] of Object.entries(flight2ranges)){
            this.range_pickers[flight].setSelections(ranges)
        }
    }

}        
        