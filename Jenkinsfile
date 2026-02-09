pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',
                    credentialsId: 'gitlab-access-token'
            }
        }

        stage('Frontend: Install & Build') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                    reuseNode true
                    args '-w /workspace'
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint || true'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                    reuseNode true
                    args '-w /workspace'
                }
            }
            steps {
                dir('backend') {
                    sh '''
                        python -m venv venv
                        . venv/bin/activate
                        pip install --upgrade pip setuptools wheel
                        pip install -r requirements.txt
                        mkdir -p test-reports
                        pytest --junitxml=test-reports/results.xml
                    '''
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
                }
            }
        }

        stage('Build Production Images') {
            when { branch 'main' }
            agent any   // host (Windows)
            steps {
                bat 'docker build -f frontend/Dockerfile.txt -t bunny-frontend:%BUILD_NUMBER% frontend'
                bat 'docker build -f backend/Dockerfile.txt -t bunny-backend:%BUILD_NUMBER% backend'
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo 'Deploy placeholder'
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
        always  { cleanWs() }
    }
}
