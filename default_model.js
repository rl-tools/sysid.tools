const rotor_x_displacement = 0.4179/2
const rotor_y_displacement = 0.481332/2
export const model = {
    gravity: 9.81,
    mass: 2.3 + 1.05,
    rotor_positions: [
        [ rotor_x_displacement, -rotor_y_displacement, 0],
        [-rotor_x_displacement,  rotor_y_displacement, 0],
        [ rotor_x_displacement,  rotor_y_displacement, 0],
        [-rotor_x_displacement, -rotor_y_displacement, 0]
    ],
    rotor_thrust_directions: [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1]
    ],
    rotor_torque_directions: [
        [0, 0, -1],
        [0, 0, -1],
        [0, 0,  1],
        [0, 0,  1]
    ]
}