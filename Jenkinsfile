pipeline {
    agent none  // Per-stage agents = best for mixed frontend/backend

    stages {
        stage('Checkout') {
            agent any  // Quick checkout on host agent
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',  // or 'master' if that's your default
                    credentialsId: 'gitlab-access-token'  // ← MUST CHANGE THIS (from Manage Credentials)
            }
        }

        stage('Frontend: Install & Build') {
            agent {
                docker {
                    image 'bunny-ci:python-node'  // Your local image – works if Jenkins on same machine
                    reuseNode true                // Reuse workspace → faster
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci'                    // Uses package-lock.json exactly
                    sh 'npm run lint || true'      // Lint optional, don't fail build
                    sh 'npm run build'
                }
            }
        }

        stage('Backend: Install & Test (with pytest)') {
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
                        pip install --upgrade pip setuptools wheel
                        pip install -r requirements.txt
                        # If pytest not in requirements.txt, install explicitly:
                        # pip install pytest pytest-django
                    '''

                    // Create reports dir (optional – pytest will create it)
                    sh 'mkdir -p test-reports'

                    // Run pytest and generate JUnit XML
                    sh '''
                        . venv/bin/activate
                        pytest --junitxml=test-reports/results.xml
                        # Add flags if needed, e.g.:
                        # pytest -v --junitxml=test-reports/results.xml tests/
                        # or pytest --ds=settings tests/
                    '''
                }
            }
            post {
                always {
                    // Publish test results to Jenkins UI (graphs, trends, failed tests details)
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
                }
            }
        }

        stage('Build Production Images') {  // Optional but recommended for demo
            when { branch 'main' }
            parallel {
                stage('Build Frontend Image') {
                    agent {
                        docker { image 'bunny-ci:python-node'; reuseNode true }
                    }
                    steps {
                        // Assumes frontend/Dockerfile exists; adjust path/filename if needed
                        sh 'docker build -f frontend/Dockerfile.txt -t bunny-frontend:${BUILD_NUMBER} frontend'
                    }
                }

                stage('Build Backend Image') {
                    agent {
                        docker { image 'bunny-ci:python-node'; reuseNode true }
                    }
                    steps {
                        sh 'docker build -f backend/Dockerfile.txt -t bunny-backend:${BUILD_NUMBER} backend'
                    }
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo 'Deploy placeholder: e.g. push images to Docker Hub / deploy to Render/Railway'
                // Later: withDockerRegistry(...) { sh 'docker push ...' }
            }
        }
    }

    post {
        success  { echo 'Pipeline succeeded! 🎉' }
        failure  { echo 'Pipeline failed – check logs.' }
        always   { cleanWs() }  // Clean workspace (optional)
    }
}