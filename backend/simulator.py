"""
Simulator for Conveyor Belt Sensor Data.

Sends realistic sensor readings to POST /api/sensors endpoint.
Different scenarios generate different sensor patterns, but actual
predictions are made by the trained Random Forest model.
"""

import requests
import json
import time
import random
from datetime import datetime
import argparse

BASE_URL = 'http://localhost:5000/api'

class ConveyorSimulator:
    """Simulate sensor readings for different conveyor health states."""
    
    # Normal healthy operating ranges
    HEALTHY_RANGES = {
        'acceleration_rms': (0.1, 0.5),
        'gyro_rms': (0.2, 1.0),
        'temperature': (35, 50),
        'current': (1.5, 2.5),
        'belt_speed': (1.4, 1.6),
        'belt_tension': (95, 105),
        'days_since_repair': (0, 180),
    }
    
    # WARNING: slight degradation
    WARNING_RANGES = {
        'acceleration_rms': (0.5, 1.2),
        'gyro_rms': (1.0, 2.0),
        'temperature': (50, 65),
        'current': (2.3, 3.2),
        'belt_speed': (1.3, 1.7),
        'belt_tension': (85, 110),
        'days_since_repair': (180, 300),
    }
    
    # HIGH_RISK: significant degradation
    HIGH_RISK_RANGES = {
        'acceleration_rms': (1.2, 2.5),
        'gyro_rms': (2.0, 4.0),
        'temperature': (65, 80),
        'current': (3.0, 4.5),
        'belt_speed': (1.1, 1.9),
        'belt_tension': (70, 120),
        'days_since_repair': (300, 500),
    }
    
    # RUPTURE: critical condition
    RUPTURE_RANGES = {
        'acceleration_rms': (2.5, 5.0),
        'gyro_rms': (4.0, 8.0),
        'temperature': (75, 95),
        'current': (4.0, 6.0),
        'belt_speed': (0.5, 2.5),
        'belt_tension': (50, 150),
        'days_since_repair': (450, 600),
    }
    
    def __init__(self, joint_id='joint_01'):
        self.joint_id = joint_id
    
    def generate_sensor_data(self, scenario='random'):
        """
        Generate sensor data for different scenarios.
        The actual prediction will be made by Random Forest model.
        """
        
        if scenario == 'healthy':
            ranges = self.HEALTHY_RANGES
        elif scenario == 'warning':
            ranges = self.WARNING_RANGES
        elif scenario == 'high_risk':
            ranges = self.HIGH_RISK_RANGES
        elif scenario == 'rupture':
            ranges = self.RUPTURE_RANGES
        elif scenario == 'random':
            # Random scenario
            scenario = random.choice(['healthy', 'warning', 'high_risk', 'rupture'])
            ranges = getattr(self, f'{scenario.upper()}_RANGES')
        else:
            raise ValueError(f"Unknown scenario: {scenario}")
        
        # Generate sensor readings within scenario ranges
        data = {
            'joint_id': self.joint_id,
            'acceleration_rms': random.uniform(*ranges['acceleration_rms']),
            'gyro_rms': random.uniform(*ranges['gyro_rms']),
            'temperature': random.uniform(*ranges['temperature']),
            'current': random.uniform(*ranges['current']),
            'belt_speed': random.uniform(*ranges['belt_speed']),
            'belt_tension': random.uniform(*ranges['belt_tension']),
            'days_since_repair': random.uniform(*ranges['days_since_repair']),
        }
        
        return data
    
    def send_sensor_data(self, scenario='random'):
        """Send sensor data to backend and print response."""
        
        data = self.generate_sensor_data(scenario)
        
        try:
            response = requests.post(
                f'{BASE_URL}/sensors',
                json=data,
                timeout=5
            )
            
            if response.status_code == 201:
                result = response.json()
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                print(f"\n[{timestamp}] ✓ Sensor data sent successfully")
                print(f"  Joint: {self.joint_id}")
                print(f"  Scenario: {scenario}")
                print(f"  Prediction: {result['prediction']}")
                print(f"  Confidence: {result['confidence']:.4f}")
                print(f"  Alert Created: {result['alert_created']}")
                print(f"  Sensor ID: {result['sensor_reading_id']}")
                
                return result
            else:
                print(f"\n✗ Error (HTTP {response.status_code}): {response.text}")
                return None
        
        except requests.exceptions.ConnectionError:
            print(f"\n✗ Connection error: Cannot reach backend at {BASE_URL}")
            return None
        except Exception as e:
            print(f"\n✗ Error: {str(e)}")
            return None
    
    def run_continuous_simulation(self, interval=5, max_iterations=None):
        """
        Run continuous sensor simulation.
        
        Args:
            interval: Seconds between sensor readings
            max_iterations: Max number of iterations (None for infinite)
        """
        
        print(f"\n{'='*60}")
        print(f"Conveyor Monitoring Simulator")
        print(f"{'='*60}")
        print(f"Backend URL: {BASE_URL}")
        print(f"Joint ID: {self.joint_id}")
        print(f"Interval: {interval} seconds")
        print(f"{'='*60}\n")
        
        iteration = 0
        try:
            while True:
                if max_iterations and iteration >= max_iterations:
                    break
                
                scenario = random.choice(['healthy', 'warning', 'high_risk', 'rupture'])
                self.send_sensor_data(scenario)
                
                iteration += 1
                if max_iterations is None:
                    print(f"\nWaiting {interval} seconds before next reading...")
                    time.sleep(interval)
                else:
                    time.sleep(interval)
        
        except KeyboardInterrupt:
            print(f"\n\n{'='*60}")
            print(f"Simulation stopped by user")
            print(f"Total iterations: {iteration}")
            print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Conveyor Belt Sensor Data Simulator'
    )
    parser.add_argument(
        '--joint-id',
        default='joint_01',
        help='Joint ID for sensor data (default: joint_01)'
    )
    parser.add_argument(
        '--scenario',
        default='random',
        choices=['healthy', 'warning', 'high_risk', 'rupture', 'random'],
        help='Scenario to simulate (default: random)'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Interval between readings in seconds (default: 5)'
    )
    parser.add_argument(
        '--count',
        type=int,
        default=None,
        help='Number of readings to send (default: infinite)'
    )
    parser.add_argument(
        '--backend-url',
        default='http://localhost:5000/api',
        help='Backend API URL (default: http://localhost:5000/api)'
    )
    
    args = parser.parse_args()
    
    global BASE_URL
    BASE_URL = args.backend_url
    
    simulator = ConveyorSimulator(joint_id=args.joint_id)
    
    if args.scenario == 'random':
        simulator.run_continuous_simulation(
            interval=args.interval,
            max_iterations=args.count
        )
    else:
        # Send single reading
        simulator.send_sensor_data(scenario=args.scenario)


if __name__ == '__main__':
    main()
