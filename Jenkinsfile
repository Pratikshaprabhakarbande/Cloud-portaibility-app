pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        EC2_IP = '3.92.31.168'
        KEY = '/c/Users/Pratiksha/Downloads/devops-key.pem'
    }

    stages {

        stage('Clone') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''
                scp -i $KEY -o StrictHostKeyChecking=no -r . ubuntu@$EC2_IP:/home/ubuntu/app

                ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP << EOF
                cd /home/ubuntu/app
                npm install
                pm2 stop app || true
                pm2 start app.js
                EOF
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment SUCCESS 🚀'
        }
        failure {
            echo 'Deployment FAILED ❌'
        }
    }
}
