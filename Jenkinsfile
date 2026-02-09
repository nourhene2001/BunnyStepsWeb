pipeline {
    agent none  // we'll define agent per stage → best for mixed tech

    stages {
        stage('Checkout') {
            agent any  // fast checkout on host
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',
                    credentialsId: 'your-github-pat-id'  // ← CHANGE TO YOUR REAL CREDENTIAL ID (from earlier)
            }
        }

        stage('Frontend: Install & Build') {
            agent {
                docker {
                    image 'bunny-ci:python-node'  // or 'yourusername/bunny-ci:python-node' if pushed
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci'               // faster & reproducible
                    sh 'npm run lint || true' // don't fail pipeline on lint warnings
                    sh 'npm run build'
                }
            }
        }

        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    sh '''
                        python -m venv venv
                        . venv/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                        # If you have requirements-dev.txt for testing extras:
                        # pip install -r requirements-dev.txt
                    '''
                    
                    // Run tests with JUnit XML output → important for Jenkins reporting
                    sh '''
                        . venv/bin/activate
                        python manage.py test --junitxml=test-reports/results.xml
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

        stage('Build Production Images') {  // Optional – great for demo / future deploy
            when { branch 'main' }
            parallel {  // build both in parallel → faster
                stage('Build Frontend Image') {
                    agent {
                        docker {
                            image 'bunny-ci:python-node'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'docker build -f ../Dockerfile.txt -t bunny-frontend:${BUILD_NUMBER} ..'  // adjust path if needed
                        }
                    }
                }

                stage('Build Backend Image') {
                    agent {
                        docker {
                            image 'bunny-ci:python-node'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('backend') {
                            sh 'docker build -f ../Dockerfile.txt -t bunny-backend:${BUILD_NUMBER} ..'
                        }
                    }
                }
            }
        }

        stage('Deploy') {  // Placeholder – expand later
            when { branch 'main' }
            steps {
                echo 'Deploy step placeholder → e.g. push images to registry, deploy to server / Render / Railway'
                // Future: docker.withRegistry(...) { sh 'docker push ...' }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! 🎉'
        }
        failure {
            echo 'Pipeline failed – check the logs.'
        }
        always {
            cleanWs()  // optional: clean workspace after build
        }
    }
}