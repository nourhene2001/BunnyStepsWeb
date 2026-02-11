pipeline {
    agent any

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Debug Repo Structure') {
            steps {
                sh '''
                    echo "=== ROOT CONTENT ==="
                    pwd
                    ls -la
                '''
            }
        }

        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                    reuseNode true
                    args '-u 0:0'
                }
            }

            steps {
                sh '''
                    echo "=== ROOT INSIDE DOCKER ==="
                    pwd
                    ls -la
                '''
            }
        }
    }

    post {
        always { cleanWs() }
    }
}
