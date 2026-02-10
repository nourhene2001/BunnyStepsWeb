pipeline {
    agent any

    stages {
        stage('Debug Clone') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',
                    credentialsId: 'gitlab-access-token'  

                sh '''
                    pwd
                    ls -la
                    if [ -d "backend" ]; then
                        echo "backend exists"
                        ls -la backend
                    else
                        echo "backend DOES NOT exist"
                    fi
                '''
            }
        }
    }
}
